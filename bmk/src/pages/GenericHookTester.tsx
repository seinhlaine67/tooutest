// components/GenericHookTester.tsx
import { useState } from "react";
import {
  useCreateCreator,
  useMutateCreatorProfile,
  useDeleteCreatorProfile,
  useAddMemberCreator,
  useRemoveCreator,
  useGetCreator,
  useGetMembers,
  useUpdateMemberRole,
} from "../hooks/useCreator";
import {
  useUpdateComment,
  useCreateComment,
  useGetComments,
  useDeleteComment,
} from "../hooks/useComment";
// import { useUpdateComment } from "../hooks/useComment";

type HookType =
  | "create"
  | "update"
  | "delete"
  | "addMember"
  | "removeMember"
  | "getCreator"
  | "getMembers"
  | "updateMemberRole"
  | "createComment"
  | "updateComment"
  | "deleteComment"
  | "getComments";

export const GenericHookTester = () => {
  const [selectedHook, setSelectedHook] = useState<HookType>("create");
  const [payload, setPayload] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const createCreator = useCreateCreator();
  const mutateProfile = useMutateCreatorProfile();
  const deleteProfile = useDeleteCreatorProfile();
  const addMember = useAddMemberCreator();
  const removeMember = useRemoveCreator();
  const getCreator = useGetCreator();
  const getMembers = useGetMembers();
  const updateMemberRole = useUpdateMemberRole();

  const updateComment = useUpdateComment();
  const createComment = useCreateComment();
  const getComments = useGetComments();
  const deleteComment = useDeleteComment();

  const hooks = {
    create: createCreator,
    update: mutateProfile,
    delete: deleteProfile,
    addMember: addMember,
    removeMember: removeMember,
    getCreator: getCreator,
    getMembers: getMembers,
    updateMemberRole: updateMemberRole,

    // comment related hooks
    updateComment: updateComment,
    createComment: createComment,
    getComments: getComments,
    deleteComment: deleteComment,
  };

  const currentHook = hooks[selectedHook];

  const executeQuery = async () => {
    try {
      let data;
      if (selectedHook === "getCreator") {
        const result = await getCreator.refetch();
        data = result.data;
      } else if (selectedHook === "getMembers") {
        const result = await getMembers.refetch();
        data = result.data;
      }
      // else if (selectedHook === "getComments") {
      //   const result = await getComments.refetch();
      //   data = result.data;
      // }

      //   setQueryData(data);
      setResults((prev) => [
        {
          timestamp: new Date().toISOString(),
          hook: selectedHook,
          type: "query",
          result: data,
          success: true,
        },
        ...prev,
      ]);
    } catch (error: any) {
      setResults((prev) => [
        {
          timestamp: new Date().toISOString(),
          hook: selectedHook,
          type: "query",
          error: error.message,
          success: false,
        },
        ...prev,
      ]);
    }
  };

  const executeHook = () => {
    try {
      const parsedPayload = JSON.parse(payload);
      currentHook.mutate(parsedPayload, {
        onSuccess: (data) => {
          setResults((prev) => [
            {
              timestamp: new Date().toISOString(),
              hook: selectedHook,
              payload: parsedPayload,
              result: data,
              success: true,
            },
            ...prev,
          ]);
        },
        onError: (error) => {
          setResults((prev) => [
            {
              timestamp: new Date().toISOString(),
              hook: selectedHook,
              payload: parsedPayload,
              error: error.message,
              success: false,
            },
            ...prev,
          ]);
        },
      });
    } catch (e) {
      alert("Invalid JSON payload");
    }
  };

  const examplePayloads = {
    create: `{
  "action": "create",
  "display_name": "Test Creator",
  "creator_type": "individual",
  "bio": "This is a test creator",
  "primary_format": "novel"
}`,
    update: `{
  "action": "update",
  "slug": "test-slug",
  "display_name": "Updated Name",
  "bio": "Updated bio"
}`,
    delete: `{
  "action": "delete"
}`,
    addMember: `{
  "action": "add",
  "studio_slug": "bmkyaw",
  "member_username": "seinlaelaehlaine",
  "role_label": "member",
  "member_creator_id": "359d93c9-9f3a-45e3-9a2c-ba5265fe8384",
   "membership_status": "active"
}`,
    removeMember: `{
  "action": "remove",
  "studio_slug": "bmkyaw",
  "member_creator_id": "359d93c9-9f3a-45e3-9a2c-ba5265fe8384"
}`,
    updateMemberRole: `{
  "action": "update",
  "studio_slug": "bmkyaw",
  "member_creator_id": "359d93c9-9f3a-45e3-9a2c-ba5265fe8384",
  "new_role_label": "editor"
}`,
    getCreator: `{Doesn't need a payload, just refetches current creator}`,
    getMembers: `{
    "action":"list"
  }`,
    getComments: `{
  "action": "get",
  "episode_id": "e5f48852-9fe1-48b9-a762-13ecbad16508",
  "page": 1,
  "limit": 20
}`,

    createComment: `{
  "action": "create",
  "episode_id": "e5f48852-9fe1-48b9-a762-13ecbad16508",
  "content": "This is a test comment",
  "parent_comment_id": "optional-parent-comment-uuid"
}`,

    updateComment: `{
  "action": "update",
  "comment_id": "568763c6-471d-4c83-a12a-5db905e665ce",
  "content": "This is my updated comment content"
}`,

    deleteComment: `{
  "action": "delete",
  "comment_id": "target-comment-uuid"
}`,
  };

  const isQuery =
    selectedHook === "getCreator" || selectedHook === "getMembers";
  // ||
  // selectedHook === "getComments";

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Generic Hook Tester</h1>

      <div style={{ marginBottom: "1rem" }}>
        <label>Select Hook: </label>
        <select
          value={selectedHook}
          onChange={(e) => {
            setSelectedHook(e.target.value as HookType);
            setPayload(examplePayloads[e.target.value as HookType]);
          }}
        >
          <optgroup label="📖 Query Hooks">
            <option value="getCreator">useGetCreator</option>
            <option value="getMembers">useGetMembers</option>
            <option value="getComments">get comments</option>
          </optgroup>
          <optgroup label="⚡ Mutation Hooks">
            <option value="create">Create Creator</option>
            <option value="update">Update Profile</option>
            <option value="delete">Delete Profile</option>
            <option value="addMember">Add Member</option>
            <option value="removeMember">Remove Member</option>
            <option value="updateMemberRole">useUpdateMemberRole</option>
            <option value="createComment">create comment</option>
            <option value="updateComment">update comment</option>
            <option value="deleteComment">delete comment</option>
          </optgroup>
        </select>
      </div>

      {/* {!isQuery && ( */}
      <div style={{ marginBottom: "1rem" }}>
        <label>Payload (JSON): </label>
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          rows={10}
          cols={60}
          style={{ fontFamily: "monospace", width: "100%" }}
        />
      </div>
      {/* )} */}

      <button
        onClick={isQuery ? executeQuery : executeHook}
        disabled={currentHook.isFetching}
        style={{ padding: "0.5rem 1rem", marginBottom: "1rem" }}
      >
        {currentHook.isFetching ? "Executing..." : "Execute Hook"}
      </button>

      {currentHook.isError && (
        <div
          style={{
            color: "red",
            padding: "1rem",
            background: "#ffeeee",
            marginBottom: "1rem",
          }}
        >
          Error: {currentHook.error?.message}
        </div>
      )}

      <div>
        <h2>Results History</h2>
        {results.map((result, idx) => (
          <div
            key={idx}
            style={{
              border: `1px solid ${result.success ? "#4caf50" : "#f44336"}`,
              padding: "1rem",
              marginBottom: "1rem",
              background: result.success ? "#f1f8e9" : "#ffebee",
            }}
          >
            <div>
              <strong>Time:</strong> {result.timestamp}
            </div>
            <div>
              <strong>Hook:</strong> {result.hook}
            </div>
            <div>
              <strong>Status:</strong>{" "}
              {result.success ? "✅ Success" : "❌ Failed"}
            </div>
            <details>
              <summary>Payload</summary>
              <pre>{JSON.stringify(result.payload, null, 2)}</pre>
            </details>
            {result.success ? (
              <details>
                <summary>Result</summary>
                <pre>{JSON.stringify(result.result, null, 2)}</pre>
              </details>
            ) : (
              <div>
                <strong>Error:</strong> {result.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
