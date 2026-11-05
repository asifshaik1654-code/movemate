const { z } = require('zod');
const { ROLES } = require('../constants/roles');

/**
 * Validation schema for inviting a collaborator to a moving plan
 */
const inviteMemberSchema = z.object({
  email: z
    .string({ required_error: 'User email is required' })
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  role: z
    .enum([ROLES.EDITOR, ROLES.VIEWER], {
      errorMap: () => ({ message: `Role must be either '${ROLES.EDITOR}' or '${ROLES.VIEWER}'` })
    })
    .default(ROLES.EDITOR)
});

/**
 * Validation schema for updating a collaborator's role
 */
const updateMemberRoleSchema = z.object({
  role: z.enum([ROLES.EDITOR, ROLES.VIEWER], {
    errorMap: () => ({ message: `Role must be either '${ROLES.EDITOR}' or '${ROLES.VIEWER}'` })
  })
});

module.exports = {
  inviteMemberSchema,
  updateMemberRoleSchema
};

