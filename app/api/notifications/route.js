export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get('to');
  
  let url = 'http://localhost:4000/notifications';
  if (to) {
    url += `?to=${encodeURIComponent(to)}`;
  }
  
  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json();
  return Response.json(data);
}

export async function POST(req) {
  const body = await req.json();

  const newNotif = {
    to: body.to,
    message: body.message,
    date: new Date().toISOString()
  };

  const response = await fetch('http://localhost:4000/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newNotif)
  });

  const notif = await response.json();
  return Response.json(notif);
}
