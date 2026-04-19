export async function PATCH(req, { params }) {
  const { id } = params;
  const updates = await req.json();

  const response = await fetch(`http://localhost:4000/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    return Response.json({ message: "Failed to update task" }, { status: response.status });
  }

  const updatedTask = await response.json();
  return Response.json(updatedTask);
}
