const PARKING_LANGUAGE_KEY='parking_language';

const PARKING_I18N={
  es:{
    language:{
      es:'Español',
      en:'English',
      selector:'Idioma'
    },
    common:{
      yes:'Sí',
      no:'No',
      all:'Todos',
      none:'Ninguno',
      loading:'Cargando datos…',
      retry:'Reintentar',
      home:'Ir al inicio',
      search:'Buscar',
      clear:'Limpiar',
      save:'Guardar',
      cancel:'Cancelar',
      close:'Cerrar',
      back:'Volver',
      actions:'Acciones',
      new:'Nuevo',
      exportExcel:'Exportar Excel',
      csv:'CSV',
      filters:'Filtros',
      hideFilters:'Ocultar filtros',
      noRecords:'No hay registros.'
    },
    auth:{
      signIn:'Iniciar sesión',
      enter:'Entrar',
      email:'Email',
      password:'Contraseña',
      forgotPassword:'¿Olvidaste tu contraseña?',
      noPassword:'Si todavía no tienes contraseña, solicítala al administrador.',
      resetPassword:'Restablecer contraseña',
      resetIntro:'Introduce el email asociado a tu cuenta.',
      sendLink:'Enviar enlace',
      backToLogin:'Volver al inicio de sesión',
      newPassword:'Nueva contraseña',
      repeatPassword:'Repetir contraseña',
      savePassword:'Guardar nueva contraseña',
      passwordRule:'Mínimo 8 caracteres, una letra y un número.',
      signOut:'Salir',
      myData:'Mis datos',
      profile:'Perfil'
    },
    nav:{
      dashboard:'Resumen',
      dataReview:'Revisión de datos',
      users:'Usuarios',
      housing:'Viviendas',
      vehicles:'Vehículos',
      incidents:'Incidencias',
      requests:'Solicitudes',
      audit:'Auditoría',
      config:'Configuración',
      control:'Control',
      ownerHome:'Inicio',
      ownerHousing:'Mis viviendas',
      ownerVehicles:'Mis vehículos',
      ownerIncidents:'Mis incidencias',
      ownerRequests:'Mis solicitudes',
      profile:'Mis datos'
    },
    roles:{
      ADMIN:'Administrador',
      CONTROL:'Control',
      PROPIETARIO:'Propietario'
    },
    status:{
      Activo:'Activo',
      Activa:'Activa',
      Inactivo:'Inactivo',
      Inactiva:'Inactiva',
      Desasignado:'Desasignado',
      Suspendido:'Suspendido',
      Baja:'Baja',
      Revocado:'Revocado',
      Abierta:'Abierta',
      Cerrada:'Cerrada',
      Aprobada:'Aprobada',
      Rechazada:'Rechazada'
    },
    maintenance:{
      title:'MANTENIMIENTO',
      defaultMessage:'Sistema temporalmente en mantenimiento. Volveremos a estar disponibles en breve.',
      note:'El acceso y el escáner están temporalmente pausados para evitar cambios durante la actualización.',
      retry:'Comprobar de nuevo',
      root:'Acceso técnico ROOT'
    }
  },

  en:{
    language:{
      es:'Español',
      en:'English',
      selector:'Language'
    },
    common:{
      yes:'Yes',
      no:'No',
      all:'All',
      none:'None',
      loading:'Loading data…',
      retry:'Retry',
      home:'Go to home',
      search:'Search',
      clear:'Clear',
      save:'Save',
      cancel:'Cancel',
      close:'Close',
      back:'Back',
      actions:'Actions',
      new:'New',
      exportExcel:'Export Excel',
      csv:'CSV',
      filters:'Filters',
      hideFilters:'Hide filters',
      noRecords:'No records found.'
    },
    auth:{
      signIn:'Sign in',
      enter:'Sign in',
      email:'Email',
      password:'Password',
      forgotPassword:'Forgot your password?',
      noPassword:'If you do not have a password yet, request one from the administrator.',
      resetPassword:'Reset password',
      resetIntro:'Enter the email address linked to your account.',
      sendLink:'Send reset link',
      backToLogin:'Back to sign in',
      newPassword:'New password',
      repeatPassword:'Repeat password',
      savePassword:'Save new password',
      passwordRule:'Minimum 8 characters, including one letter and one number.',
      signOut:'Sign out',
      myData:'My details',
      profile:'Profile'
    },
    nav:{
      dashboard:'Overview',
      dataReview:'Data review',
      users:'Users',
      housing:'Properties',
      vehicles:'Vehicles',
      incidents:'Incidents',
      requests:'Requests',
      audit:'Audit',
      config:'Settings',
      control:'Access control',
      ownerHome:'Home',
      ownerHousing:'My properties',
      ownerVehicles:'My vehicles',
      ownerIncidents:'My incidents',
      ownerRequests:'My requests',
      profile:'My details'
    },
    roles:{
      ADMIN:'Administrator',
      CONTROL:'Access control',
      PROPIETARIO:'Owner'
    },
    status:{
      Activo:'Active',
      Activa:'Active',
      Inactivo:'Inactive',
      Inactiva:'Inactive',
      Desasignado:'Unassigned',
      Suspendido:'Suspended',
      Baja:'Deactivated',
      Revocado:'Revoked',
      Abierta:'Open',
      Cerrada:'Closed',
      Aprobada:'Approved',
      Rechazada:'Rejected'
    },
    maintenance:{
      title:'MAINTENANCE',
      defaultMessage:'The system is temporarily under maintenance. It will be available again shortly.',
      note:'Access and the scanner are temporarily paused to prevent changes during the update.',
      retry:'Check again',
      root:'ROOT technical access'
    }
  }
};

function i18nGet(object,path){
  return String(path||'')
    .split('.')
    .reduce((value,key)=>value&&value[key],object);
}

function detectParkingLanguage(){
  try{
    const saved=localStorage.getItem(PARKING_LANGUAGE_KEY);
    if(saved==='es'||saved==='en')return saved;
  }catch(_e){}

  const browser=String(
    navigator.languages?.[0]||
    navigator.language||
    ''
  ).toLowerCase();

  return browser.startsWith('en')?'en':'es';
}

let PARKING_LANGUAGE=detectParkingLanguage();

function currentLanguage(){
  return PARKING_LANGUAGE;
}

function t(key,params={}){
  let value=
    i18nGet(PARKING_I18N[PARKING_LANGUAGE],key) ??
    i18nGet(PARKING_I18N.es,key) ??
    key;

  value=String(value);

  Object.entries(params||{}).forEach(([name,replacement])=>{
    value=value.replaceAll(`{${name}}`,String(replacement??''));
  });

  return value;
}

function translateStatus(value){
  const raw=String(value??'');
  return t(`status.${raw}`)===`status.${raw}`
    ? raw
    : t(`status.${raw}`);
}

function translateRole(value){
  const raw=String(value??'').toUpperCase();
  return t(`roles.${raw}`)===`roles.${raw}`
    ? value
    : t(`roles.${raw}`);
}

function setParkingLanguage(language,{reload=true}={}){
  if(language!=='es'&&language!=='en')return false;

  PARKING_LANGUAGE=language;

  try{
    localStorage.setItem(
      PARKING_LANGUAGE_KEY,
      language
    );
  }catch(_e){}

  document.documentElement.lang=language;

  if(reload)location.reload();

  return true;
}

function languageSelectorHtml(className='language-switch'){
  const lang=currentLanguage();

  return `<div class="${className}" role="group" aria-label="${esc(t('language.selector'))}">
    <button type="button" class="secondary compact language-option ${lang==='es'?'active':''}" data-language="es" aria-pressed="${lang==='es'}">ES</button>
    <button type="button" class="secondary compact language-option ${lang==='en'?'active':''}" data-language="en" aria-pressed="${lang==='en'}">EN</button>
  </div>`;
}

function bindLanguageSelectors(root=document){
  root.querySelectorAll('[data-language]').forEach(button=>{
    button.addEventListener('click',()=>{
      setParkingLanguage(button.dataset.language);
    });
  });
}

document.documentElement.lang=currentLanguage();
