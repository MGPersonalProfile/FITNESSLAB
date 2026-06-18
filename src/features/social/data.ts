import { supabase } from "@/shared/lib/supabaseClient";
import type { Friend, FriendRequest } from "@/shared/types";

export async function fetchFriends(): Promise<Friend[]> {
  const { data } = await supabase.rpc("get_friends");
  return (data as Friend[]) ?? [];
}

export async function fetchPendingRequests(): Promise<FriendRequest[]> {
  const { data } = await supabase.rpc("get_pending_requests");
  return (data as FriendRequest[]) ?? [];
}

export type RequestResult = "ok" | "not_found" | "self" | "exists" | "error";

export async function sendFriendRequest(email: string): Promise<RequestResult> {
  const { data, error } = await supabase.rpc("send_friend_request", { target_email: email });
  if (error) return "error";
  return (data as RequestResult) ?? "error";
}

export async function respondRequest(id: string, accept: boolean): Promise<void> {
  if (accept) {
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
  } else {
    await supabase.from("friendships").delete().eq("id", id);
  }
}

export async function removeFriend(myId: string, friendId: string): Promise<void> {
  await supabase
    .from("friendships")
    .delete()
    .or(
      `and(requester.eq.${myId},addressee.eq.${friendId}),and(requester.eq.${friendId},addressee.eq.${myId})`,
    );
}
