// Genera la clave "encriptada" para ABM_USUARIOS. Uso: node tools/hash-password.js "la-clave"
const crypto = require("crypto");
const clave = process.argv[2];
if (!clave || clave.length < 8) {
  console.log('Uso: node tools/hash-password.js "la-clave"   (mínimo 8 caracteres)');
  process.exit(1);
}
const sal = crypto.randomBytes(16).toString("hex");
console.log(`scrypt$${sal}$${crypto.scryptSync(clave, Buffer.from(sal, "hex"), 32).toString("hex")}`);
