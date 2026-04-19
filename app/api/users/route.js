export async function GET() {
  const res = await fetch('http://localhost:4000/users', { cache: 'no-store' });
  const users = await res.json();
  // Don't send passwords back to the client
  const safeUsers = users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
  return Response.json(safeUsers);
}
