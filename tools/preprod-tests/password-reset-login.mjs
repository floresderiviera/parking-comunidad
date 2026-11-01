import fs from 'node:fs';

const auth = fs.readFileSync('assets/js/auth-navigation.js','utf8');
const adapter = fs.readFileSync('assets/js/supabase-final-adapter.js','utf8');
const supabaseAuth = fs.readFileSync('assets/js/supabase/auth.js','utf8');

const tests = [
  ['login muestra olvidé contraseña', auth.includes('¿Olvidaste tu contraseña?')],
  ['existe pantalla solicitud reset', auth.includes('function forgotPassword()')],
  ['mensaje no enumera usuarios', auth.includes('Si el correo está registrado')],
  ['recovery usa query param', auth.includes("get('resetPassword')==='1'")],
  ['existe pantalla nueva contraseña', auth.includes('function recoveryPassword()')],
  ['módulo auth usa resetPasswordForEmail', supabaseAuth.includes('resetPasswordForEmail')],
  ['módulo auth usa updateUser password', supabaseAuth.includes('updateUser({') && supabaseAuth.includes('password')],
  ['redirect deriva del path actual', supabaseAuth.includes('location.pathname')]
];

let failed=false;
for(const [label,ok] of tests){
  console.log(`${ok?'OK  ':'FAIL'} ${label}`);
  if(!ok)failed=true;
}
if(failed)process.exit(1);
console.log('Password reset login parity: OK');
