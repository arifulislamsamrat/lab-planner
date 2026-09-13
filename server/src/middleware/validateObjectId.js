const ApiError = require('../utils/ApiError');

function validateObjectId(paramName = 'id') {
  return (req, _res, next) => {
    const value = req.params[paramName];
    if (!value || !/^[0-9a-fA-F]{24}$/.test(value)) {
      return next(new ApiError(400, `Invalid id parameter: ${paramName}`));
    }
    return next();
  };
}

module.exports = validateObjectId;