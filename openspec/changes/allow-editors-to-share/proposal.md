# Proposal: Allow Editors to Share Dashboards and KPIs

## Change ID
`allow-editors-to-share`

## Summary
Extend sharing capabilities to users who have EDIT access on a dashboard or KPI, allowing them to grant access to other users. Currently, only owners and admins can share resources. This change enables a more collaborative workflow where editors can bring in additional team members.

## Motivation
In collaborative environments, it's common for team members with edit access to need to share resources with others. Currently:
- Only owners and admins can share dashboards/KPIs
- Editors must ask the owner to add new users
- This creates bottlenecks in team collaboration

The proposed change allows editors to share resources they have edit access to, while maintaining security by limiting what they can grant:
- Editors can only share resources they can edit
- Editors cannot grant higher permissions than they have (i.e., cannot make someone else an owner)
- Owners and admins retain full control

## Requirements Addressed
- Collaboration: Editors can add team members to resources they work on
- Security: Permission grants are limited to what the granting user has access to
- Usability: Reduces friction in team workflows

## Scope

### In Scope
1. **Permission service changes**: Allow EDIT access holders to grant VIEW/EDIT access to others
2. **Sharing router changes**: Update permission checks to allow editors to share
3. **Access management endpoints**: Allow editors to manage access on resources they can edit
4. **Frontend changes**: Show "Manage Access" option for users with EDIT permission

### Out of Scope
- Allowing editors to remove owner access
- Allowing editors to change the owner
- Allowing viewers to share (they have no edit access)

## Design Overview

### Permission Changes

Current permission model for MANAGE:
```
MANAGE permission → Only owners (and admins)
```

New permission model:
```
SHARE permission → Owners, Admins, or users with EDIT access
  - Can grant VIEW or EDIT access to others
  - Cannot grant access higher than their own
  - Cannot remove owner's access
  - Cannot change ownership
```

### Rules for Editors Sharing
1. Editor can grant VIEW access to any user
2. Editor can grant EDIT access to any user  
3. Editor can revoke access they granted (or access at their level or below)
4. Editor cannot see or modify owner's implicit access
5. Editor cannot remove admin's implicit access

### API Changes
No new endpoints required. Existing endpoints are updated:
- `POST /api/dashboards/:id/access` - Allow editors
- `PUT /api/dashboards/:id/access/:userId` - Allow editors
- `DELETE /api/dashboards/:id/access/:userId` - Allow editors (with restrictions)
- Same changes for KPI access endpoints

### Frontend Changes
- `AccessManagementDialog` already exists
- Add `canManageAccess` flag to determine if dialog is shown
- Update permission checks to allow EDIT access holders to open the dialog

## Impact Analysis

### Breaking Changes
None. This is an additive change that grants more permissions.

### Migration Strategy
No migration required. Existing permissions remain valid.

### Security Considerations
- Editors cannot escalate beyond their own permissions
- Editors cannot remove owner or admin access
- All access grants are auditable via createdById

## Success Criteria
- [ ] Users with EDIT access can open the "Manage Access" dialog
- [ ] Users with EDIT access can grant VIEW access to others
- [ ] Users with EDIT access can grant EDIT access to others
- [ ] Users with EDIT access can revoke access (except owner/admin)
- [ ] Users with VIEW access cannot share
- [ ] Owners retain full control over their resources
- [ ] Admins retain full control over all resources

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Editor accidentally shares with wrong user | Access can be revoked; audit trail exists |
| Permission creep | Owners can revoke any access; admins have oversight |
| Complexity in permission checks | Centralize logic in permission service |

## Approval
- [ ] Proposal reviewed
- [ ] Design approved
- [ ] Ready for implementation
