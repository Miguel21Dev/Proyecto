const http = require('http');
const data = 'accion=crear&nombre=TestNode&departamento=IT&asunto=PruebaNode';
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/controlador/php/tickets.php',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let buf = '';
  res.on('data', (c) => buf += c);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log(buf);
  });
});
req.on('error', (e) => { console.error('ERROR', e.message); });
req.write(data);
req.end();
