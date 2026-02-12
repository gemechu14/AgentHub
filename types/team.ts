// Team Member Types

export interface TeamMember {
  id?: string;
  email: string;
  role: string;
  status: "active" | "pending";
  user_id?: string;
}

export interface TeamMemberResponse {
  email: string;
  role: string;
  status: "active" | "pending";
  user_id?: string | null;
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





