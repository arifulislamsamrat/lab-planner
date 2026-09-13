/* eslint-disable no-console */
// Local smoke test: boots an in-memory MongoDB, exercises the full API end-to-end,
// including the auth flow, role gating, and the existing hierarchy. Exits 0 on success.
// Run with `npm run smoke` (requires JWT_SECRET in env or .env).
process.env.JWT_SECRET = process.env.JWT_SECRET || 'smoke-test-jwt-secret-change-me';

const { startTestServer } = require('./testApp');

async function http(method, url, body, port, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`http://127.0.0.1:${port}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, body: json };
}

function assert(cond, msg) { if (!cond) { console.error('FAIL:', msg); process.exit(1); } }

(async () => {
  const { server, port, mem } = await startTestServer();
  try {
    // Health
    const health = await http('GET', '/api/health', null, port);
    assert(health.status === 200 && health.body.ok === true, 'health endpoint');

    // Bootstrap status before any user exists.
    const status0 = await http('GET', '/api/auth/status', null, port);
    assert(status0.status === 200 && status0.body.data.bootstrapped === false, 'auth status says not bootstrapped');

    // ----- Unauthenticated: every protected route should 401 -----
    const unauthChecks = [
      ['GET', '/api/courses'],
      ['GET', '/api/users'],
      ['GET', '/api/roles'],
      ['GET', '/api/dashboard/summary'],
      ['GET', '/api/auth/me'],
    ];
    for (const [m, u] of unauthChecks) {
      const r = await http(m, u, null, port);
      assert(r.status === 401, `unauth ${m} ${u} -> 401 (got ${r.status})`);
    }

    // ----- Bootstrap first admin -----
    const boot = await http('POST', '/api/auth/bootstrap', {
      name: 'Smoke Admin',
      email: 'admin@smoke.local',
      password: 'admin12345',
    }, port);
    assert(boot.status === 201 && boot.body.data.token, 'bootstrap first admin');
    const adminToken = boot.body.data.token;

    // Bootstrap is now closed.
    const boot2 = await http('POST', '/api/auth/bootstrap', {
      name: 'x', email: 'x@x.x', password: 'abcdefgh',
    }, port);
    assert(boot2.status === 410, 'bootstrap closed after first admin');

    // /api/auth/me with the admin token works.
    const me = await http('GET', '/api/auth/me', null, port, adminToken);
    assert(me.status === 200 && me.body.data.role === 'ADMIN', '/me returns admin');

    // Login as admin.
    const login = await http('POST', '/api/auth/login', {
      email: 'admin@smoke.local', password: 'admin12345',
    }, port);
    assert(login.status === 200 && login.body.data.token, 'admin login');
    const adminToken2 = login.body.data.token;

    // Bad credentials → 401.
    const badLogin = await http('POST', '/api/auth/login', {
      email: 'admin@smoke.local', password: 'wrong',
    }, port);
    assert(badLogin.status === 401, 'bad password rejected');

    // Admin creates the other role users.
    const make = async (role, email) => {
      const r = await http('POST', '/api/users', {
        name: role, email, password: 'role12345', role,
      }, port, adminToken2);
      assert(r.status === 201, `admin creates ${role}`);
      return r.body.data;
    };
    const coord = await make('COURSE_COORDINATOR', 'coord@smoke.local');
    const instructor = await make('INSTRUCTOR', 'inst@smoke.local');
    const minion = await make('MINION', 'min@smoke.local');

    // Duplicate email → 409.
    const dupe = await http('POST', '/api/users', {
      name: 'x', email: 'coord@smoke.local', password: 'role12345', role: 'INSTRUCTOR',
    }, port, adminToken2);
    assert(dupe.status === 409, 'duplicate email 409');

    // Roles list visible to admin.
    const roles = await http('GET', '/api/roles', null, port, adminToken2);
    assert(roles.status === 200 && roles.body.data.length === 4, 'roles list returns 4');

    // Login as each role.
    const coordLogin = await http('POST', '/api/auth/login', { email: 'coord@smoke.local', password: 'role12345' }, port);
    const coordToken = coordLogin.body.data.token;
    const instLogin = await http('POST', '/api/auth/login', { email: 'inst@smoke.local', password: 'role12345' }, port);
    const instToken = instLogin.body.data.token;
    const minLogin = await http('POST', '/api/auth/login', { email: 'min@smoke.local', password: 'role12345' }, port);
    const minToken = minLogin.body.data.token;

    // Instructor cannot access /api/users.
    const instAsksUsers = await http('GET', '/api/users', null, port, instToken);
    assert(instAsksUsers.status === 403, 'instructor blocked from /api/users');

    // Instructor cannot create a course.
    const instCreatesCourse = await http('POST', '/api/courses', {
      title: 'nope', status: 'ACTIVE',
    }, port, instToken);
    assert(instCreatesCourse.status === 403, 'instructor blocked from creating a course');

    // Minion also blocked from creating a course.
    const minCreatesCourse = await http('POST', '/api/courses', {
      title: 'nope', status: 'ACTIVE',
    }, port, minToken);
    assert(minCreatesCourse.status === 403, 'minion blocked from creating a course');

    // ----- Hierarchy E2E as Course Coordinator -----
    const c = await http('POST', '/api/courses', { title: 'DevOps Career Track', description: 'desc', status: 'ACTIVE' }, port, coordToken);
    assert(c.status === 201, 'coord creates course');
    const courseId = c.body.data._id;

    const ms = await http('POST', `/api/courses/${courseId}/milestones`, { title: 'Linux & Networking' }, port, coordToken);
    assert(ms.status === 201, 'create milestone');
    const milestoneId = ms.body.data._id;

    const mod = await http('POST', `/api/milestones/${milestoneId}/modules`, { title: 'Linux Fundamentals' }, port, coordToken);
    assert(mod.status === 201, 'create module');
    const moduleId = mod.body.data._id;

    const lg = await http('POST', `/api/modules/${moduleId}/lab-groups`, { title: 'Basic Commands' }, port, coordToken);
    assert(lg.status === 201, 'create lab group');
    const labGroupId = lg.body.data._id;

    const lab = await http('POST', `/api/lab-groups/${labGroupId}/labs`, {
      title: 'File Management',
      estimatedTime: 45,
      mdLink: 'https://raw.githubusercontent.com/example/repo/main/README.md',
      sourceLink: 'https://github.com/example/repo',
    }, port, coordToken);
    assert(lab.status === 201, 'create lab');
    const labId = lab.body.data._id;

    // Status update as coord.
    const upd = await http('PATCH', `/api/labs/${labId}/status`, { status: 'IN_PROGRESS' }, port, coordToken);
    assert(upd.status === 200 && upd.body.data.status === 'IN_PROGRESS', 'coord updates lab status');

    // Minion creates another lab.
    const lab2 = await http('POST', `/api/lab-groups/${labGroupId}/labs`, {
      title: 'Minion Lab',
      estimatedTime: 30,
    }, port, minToken);
    assert(lab2.status === 201, 'minion creates lab');
    const lab2Id = lab2.body.data._id;

    // Minion updates its own lab.
    const lab2Edit = await http('PUT', `/api/labs/${lab2Id}`, {
      title: 'Minion Lab (edited)',
      estimatedTime: 35,
    }, port, minToken);
    assert(lab2Edit.status === 200, 'minion edits lab');

    // Instructor blocked from creating a lab.
    const instCreatesLab = await http('POST', `/api/lab-groups/${labGroupId}/labs`, {
      title: 'nope',
    }, port, instToken);
    assert(instCreatesLab.status === 403, 'instructor blocked from creating lab');

    // Instructor can change status of a lab.
    const instChangeStatus = await http('PATCH', `/api/labs/${labId}/status`, { status: 'DONE' }, port, instToken);
    assert(instChangeStatus.status === 200, 'instructor can change lab status');

    // Comments — anyone authenticated can post.
    const c1 = await http('POST', `/api/labs/${labId}/comments`, { body: 'Looks good.' }, port, instToken);
    assert(c1.status === 201 && c1.body.data.userName === 'INSTRUCTOR', 'instructor posts comment');
    const c1Id = c1.body.data._id;

    const c2 = await http('POST', `/api/labs/${labId}/comments`, { body: 'Working on it.' }, port, minToken);
    assert(c2.status === 201, 'minion posts comment');
    const c2Id = c2.body.data._id;

    // Minion tries to delete instructor's comment → 403.
    const badDel = await http('DELETE', `/api/labs/${labId}/comments/${c1Id}`, null, port, minToken);
    assert(badDel.status === 403, 'minion cannot delete instructor comment');

    // Instructor deletes own comment → 204.
    const okDel = await http('DELETE', `/api/labs/${labId}/comments/${c1Id}`, null, port, instToken);
    assert(okDel.status === 204, 'instructor deletes own comment');

    // Read lab to verify comments are visible.
    const labRead = await http('GET', `/api/labs/${labId}`, null, port, coordToken);
    assert(labRead.status === 200 && labRead.body.data.comments.length === 1, 'lab has remaining comment');

    // Inline markdown path.
    const inlineLab = await http('POST', `/api/lab-groups/${labGroupId}/labs`, {
      title: 'Inline Lab',
      mdContent: '# Hello\n\nThis is **markdown**.',
    }, port, coordToken);
    assert(inlineLab.status === 201, 'create lab with mdContent');
    const inlineLabId = inlineLab.body.data._id;

    const inlineRes = await http('GET', `/api/labs/${inlineLabId}/resource`, null, port, coordToken);
    assert(inlineRes.status === 200 && inlineRes.body.data.source === 'inline', 'inline markdown serves');

    // Empty lab → 404 on resource.
    const emptyLab = await http('POST', `/api/lab-groups/${labGroupId}/labs`, { title: 'Empty Lab' }, port, coordToken);
    const emptyLabId = emptyLab.body.data._id;
    const emptyRes = await http('GET', `/api/labs/${emptyLabId}/resource`, null, port, coordToken);
    assert(emptyRes.status === 404, 'resource 404 when no source');

    // Planning tree
    const plan = await http('GET', `/api/courses/${courseId}/planning`, null, port, coordToken);
    assert(plan.status === 200 && plan.body.data.milestones.length === 1, 'planning tree');

    // Reorder milestones
    const ms2 = await http('POST', `/api/courses/${courseId}/milestones`, { title: 'Git & GitHub' }, port, coordToken);
    const ms2Id = ms2.body.data._id;
    const reord = await http('PATCH', `/api/courses/${courseId}/milestones/reorder`, {
      items: [{ id: ms2Id, order: 0 }, { id: milestoneId, order: 1 }],
    }, port, coordToken);
    assert(reord.status === 200, 'reorder milestones');

    // Safe delete: deleting module with lab groups should fail with 409
    const delMod = await http('DELETE', `/api/modules/${moduleId}`, null, port, coordToken);
    assert(delMod.status === 409, 'safe delete refuses module with lab groups');

    // Delete the inline-md lab + lab group first.
    await http('DELETE', `/api/labs/${inlineLabId}`, null, port, coordToken);
    await http('DELETE', `/api/labs/${emptyLabId}`, null, port, coordToken);
    await http('DELETE', `/api/labs/${lab2Id}`, null, port, coordToken);
    await http('DELETE', `/api/labs/${labId}`, null, port, coordToken);
    await http('DELETE', `/api/lab-groups/${labGroupId}`, null, port, coordToken);
    const delMod2 = await http('DELETE', `/api/modules/${moduleId}`, null, port, coordToken);
    assert(delMod2.status === 204, 'module deletes after children removed');

    // Coord can delete the course (Danger Zone path).
    const delCourse = await http('DELETE', `/api/courses/${courseId}`, null, port, coordToken);
    assert(delCourse.status === 200 || delCourse.status === 204, 'coord deletes course');

    // Instructor cannot delete course.
    const course2 = await http('POST', '/api/courses', { title: 'keep me', status: 'DRAFT' }, port, coordToken);
    assert(course2.status === 201, 'create second course for delete-403 test');
    const course2Id = course2.body.data._id;
    const instDelCourse = await http('DELETE', `/api/courses/${course2Id}`, null, port, instToken);
    assert(instDelCourse.status === 403, 'instructor blocked from deleting course');
    await http('DELETE', `/api/courses/${course2Id}`, null, port, coordToken);

    // Dashboard summary
    const dash = await http('GET', '/api/dashboard/summary', null, port, adminToken2);
    assert(dash.status === 200 && typeof dash.body.data.counts.courses === 'number', 'dashboard summary');

    // Admin can disable a user; their token then fails /me.
    const disable = await http('PATCH', `/api/users/${minion.id}`, { isActive: false }, port, adminToken2);
    assert(disable.status === 200, 'admin disables user');
    const minAfter = await http('GET', '/api/auth/me', null, port, minToken);
    assert(minAfter.status === 401, 'disabled user cannot use old token');

    console.log('All smoke checks passed.');
  } catch (e) {
    console.error('Smoke test threw:', e);
    process.exit(1);
  } finally {
    server.close();
    await mem.stop();
  }
})();
