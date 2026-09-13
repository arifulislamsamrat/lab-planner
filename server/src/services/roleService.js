const { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } = require('../utils/constants');

function listRoles() {
  return ROLES.map((key) => ({
    key,
    label: ROLE_LABELS[key],
    description: ROLE_DESCRIPTIONS[key],
  }));
}

module.exports = { listRoles };
