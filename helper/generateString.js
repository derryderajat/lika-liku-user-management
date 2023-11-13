const { v4: uuidv4 } = require("uuid");
const generateUuidWithoutDashes = () => {
  const uuidWithDashes = uuidv4();
  const uuidWithoutDashes = uuidWithDashes.replace(/-/g, ""); // Remove dashes
  return uuidWithoutDashes;
};
module.exports = { generateUuidWithoutDashes };
