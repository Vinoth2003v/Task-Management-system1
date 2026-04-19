export async function POST(req) {
  try {
    const { email, password } = await req.json();

    const res = await fetch(`http://localhost:4000/users?email=${encodeURIComponent(email)}`, {
      cache: 'no-store',
    });
    const users = await res.json();

    if (!users || users.length === 0) {
      return Response.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const user = users[0];

    if (user.password !== password) {
      return Response.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Return user without password
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    return Response.json({ user: safeUser });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}