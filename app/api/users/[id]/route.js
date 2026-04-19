export async function PATCH(req, { params }) {
  const { id } = await params;
  const body = await req.json();
  
  const res = await fetch(`http://localhost:4000/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  const user = await res.json();
  return Response.json(user);
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  
  await fetch(`http://localhost:4000/users/${id}`, {
    method: 'DELETE'
  });
  
  return Response.json({ success: true });
}
