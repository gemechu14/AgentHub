// Team Member Types

export interface TeamMember {
  id?: string;
  email: string;
  role: string;
  status: "active" | "pending" | "expired";
  user_id?: string;
  agent_access?: string[]; // Agent IDs assigned to this member
  schema_access?: string[]; // Schema access (if applicable)
}

export interface TeamMemberResponse {
  email: string;
  role: string;
  status: "active" | "pending" | "expired";
  user_id?: string | null;
  agent_access?: string[]; // Agent IDs assigned to this member
  schema_access?: string[]; // Schema access (if applicable)
}

export interface InviteMemberRequest {
  email: string;
  role: string; // "MEMBER" or "ADMIN" or "OWNER"
  manage_agent_ids?: string[]; // Only included if role is MEMBER
}

export interface UpdateMemberPermissionsRequest {
  email?: string;
  user_id?: string;
  role: string; // "MEMBER" or "ADMIN"
}

export interface DeleteUserRequest {
  email: string;
}

export interface SuccessResponse {
  ok: boolean;
  message?: string;
}





