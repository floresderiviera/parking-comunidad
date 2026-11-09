import fs from 'node:fs';

const auth = fs.readFileSync(
  'assets/js/auth-navigation.js',
  'utf8'
);

const i18n = fs.readFileSync(
  'assets/js/i18n.js',
  'utf8'
);

const supabaseAuth = fs.readFileSync(
  'assets/js/supabase/auth.js',
  'utf8'
);

const tests = [
  [
    'login muestra olvidé contraseña vía i18n',
    auth.includes("t('auth.forgotPassword')")
  ],
  [
    'texto olvidé contraseña existe ES',
    i18n.includes(
      "forgotPassword:'¿Olvidaste tu contraseña?'"
    )
  ],
  [
    'texto olvidé contraseña existe EN',
    i18n.includes(
      "forgotPassword:'Forgot your password?'"
    )
  ],
  [
    'existe pantalla solicitud reset',
    auth.includes('function forgotPassword()')
  ],
  [
    'mensaje reset no enumera usuarios vía i18n',
    auth.includes("t('authExtra.resetSent')")
  ],
  [
    'mensaje reset neutro existe ES',
    i18n.includes(
      "resetSent:'Si el correo está registrado"
    )
  ],
  [
    'mensaje reset neutro existe EN',
    i18n.includes(
      "resetSent:'If the email is registered"
    )
  ],
  [
    'recovery usa query param',
    auth.includes("get('resetPassword')==='1'")
  ],
  [
    'existe pantalla nueva contraseña',
    auth.includes('function recoveryPassword()')
  ],
  [
    'módulo auth usa resetPasswordForEmail',
    supabaseAuth.includes('resetPasswordForEmail')
  ],
  [
    'módulo auth usa updateUser password',
    supabaseAuth.includes('updateUser({') &&
      supabaseAuth.includes('password')
  ],
  [
    'redirect deriva del path actual',
    supabaseAuth.includes('location.pathname')
  ]
];

let failed=false;

for(const [label,ok] of tests){
  console.log(
    `${ok?'OK  ':'FAIL'} ${label}`
  );

  if(!ok)failed=true;
}

if(failed)process.exit(1);

console.log(
  'Password reset login parity: OK'
);
