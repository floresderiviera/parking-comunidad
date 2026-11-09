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


Object.assign(PARKING_I18N.es,{
  shell:{
    profile:'Perfil',
    activeProfile:'Perfil activo',
    openMenu:'Abrir menú',
    menu:'Menú',
    more:'Más',
    moreSections:'Más secciones',
    closeMenu:'Cerrar menú',
    mobileNavigation:'Navegación móvil',
    openMyData:'Abrir Mis datos'
  },
  authExtra:{
    loginIntro:'Accede con tu email y contraseña.',
    recoveryTitle:'Crear nueva contraseña',
    recoveryIntro:'Introduce una nueva contraseña para tu cuenta.',
    resetSent:'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
    resetRequestError:'No se pudo solicitar el restablecimiento.',
    passwordMismatch:'Las contraseñas no coinciden.',
    passwordInvalid:'La contraseña debe tener al menos 8 caracteres, una letra y un número.',
    passwordUpdated:'Contraseña actualizada correctamente. Ya puedes iniciar sesión.',
    passwordUpdateError:'No se pudo actualizar la contraseña.'
  },
  errors:{
    configurationForbidden:'No tienes permisos para acceder a Configuración.',
    loadGeneric:'No se pudo cargar la información.',
    loadView:'No se pudo cargar {view}.'
  }
});

Object.assign(PARKING_I18N.en,{
  shell:{
    profile:'Profile',
    activeProfile:'Active profile',
    openMenu:'Open menu',
    menu:'Menu',
    more:'More',
    moreSections:'More sections',
    closeMenu:'Close menu',
    mobileNavigation:'Mobile navigation',
    openMyData:'Open My details'
  },
  authExtra:{
    loginIntro:'Sign in with your email and password.',
    recoveryTitle:'Create new password',
    recoveryIntro:'Enter a new password for your account.',
    resetSent:'If the email is registered, you will receive a link to reset your password.',
    resetRequestError:'The password reset request could not be completed.',
    passwordMismatch:'The passwords do not match.',
    passwordInvalid:'The password must contain at least 8 characters, one letter and one number.',
    passwordUpdated:'Password updated successfully. You can now sign in.',
    passwordUpdateError:'The password could not be updated.'
  },
  errors:{
    configurationForbidden:'You do not have permission to access Settings.',
    loadGeneric:'The information could not be loaded.',
    loadView:'Could not load {view}.'
  }
});


const PARKING_UI_EN_EXACT={
  'Inicio':'Home',
  'Resumen':'Overview',
  'Resumen del parking':'Parking overview',
  'Estado general':'General status',
  'Pendientes':'Pending',
  'Revisión de datos':'Data review',
  'Usuarios':'Users',
  'Usuario':'User',
  'Viviendas':'Properties',
  'Vivienda':'Property',
  'Mis viviendas':'My properties',
  'Vehículos':'Vehicles',
  'Vehículo':'Vehicle',
  'Mis vehículos':'My vehicles',
  'Incidencias':'Incidents',
  'Incidencia':'Incident',
  'Mis incidencias':'My incidents',
  'Solicitudes':'Requests',
  'Solicitud':'Request',
  'Mis solicitudes':'My requests',
  'Auditoría':'Audit',
  'Configuración':'Settings',
  'Control':'Access control',
  'Control de acceso':'Access control',
  'Mis datos':'My details',

  'Buscar':'Search',
  'Cerrar':'Close',
  'Volver':'Back',
  'Guardar':'Save',
  'Guardar cambios':'Save changes',
  'Cancelar':'Cancel',
  'Editar':'Edit',
  'Nuevo':'New',
  'Nueva':'New',
  'Eliminar':'Delete',
  'Ver':'View',
  'Historial':'History',
  'Temporales':'Temporary plates',
  'Acciones':'Actions',
  'Acciones masivas':'Bulk actions',
  'Mostrar':'Show',
  'Filtros':'Filters',
  'Ocultar filtros':'Hide filters',
  'Limpiar':'Clear',
  'Todos':'All',
  'Todas':'All',
  'Ninguno':'None',
  'Seleccionar…':'Select…',
  'Selecciona una acción':'Select an action',

  'Estado':'Status',
  'Clase':'Class',
  'Tipo':'Type',
  'Prioridad':'Priority',
  'Origen':'Source',
  'Detalle':'Details',
  'Resolución':'Resolution',
  'Seguimiento':'Follow-up',
  'Intentos':'Attempts',
  'Fecha':'Date',
  'Fecha inicio':'Start date',
  'Fecha fin prevista':'Expected end date',
  'Última actividad':'Last activity',
  'Último acceso':'Last access',
  'Último seguimiento':'Last follow-up',

  'Matrícula':'Plate',
  'Matrícula habitual':'Main plate',
  'Matrícula temporal':'Temporary plate',
  'Matrícula nueva':'New plate',
  'Nueva matrícula habitual':'New main plate',
  'Matrícula observada':'Observed plate',
  'Matrícula comprobada':'Checked plate',
  'Matrícula válida actualmente':'Currently valid plate',
  'Vigencia temporal':'Temporary validity',
  'Temporal actual':'Current temporary plate',
  'Temporal vigente':'Current temporary plate',

  'Propietario':'Owner',
  'Responsable':'Responsible person',
  'Solicitante':'Requester',
  'Nombre':'Name',
  'Email':'Email',
  'Marca':'Make',
  'Modelo':'Model',
  'Marca / modelo':'Make / model',
  'Marca/modelo':'Make/model',
  'Observaciones':'Notes',
  'Comentario':'Comment',
  'Comentario de cierre':'Closing comment',

  'Slot':'Slot',
  'Slots':'Slots',
  'Con slot':'With slot',
  'Sin slot':'No slot',
  'Liberado':'Released',
  'Libre':'Free',
  'Disponible':'Available',
  'No aplica':'Not applicable',

  'Activo':'Active',
  'Activa':'Active',
  'Inactivo':'Inactive',
  'Inactiva':'Inactive',
  'Desasignado':'Unassigned',
  'Suspendido':'Suspended',
  'Baja':'Deactivated',
  'Revocado':'Revoked',
  'Abierta':'Open',
  'Abiertas':'Open',
  'Cerrada':'Closed',
  'Aprobada':'Approved',
  'Aprobadas':'Approved',
  'Rechazada':'Rejected',
  'Rechazadas':'Rejected',
  'Pendiente':'Pending',
  'Históricas':'History',
  'Resueltas':'Resolved',

  'Moto':'Motorcycle',
  'Motos':'Motorcycles',
  'Vehículo con slot':'Vehicle with slot',
  'Particular':'Private',
  'Empresa':'Company',
  'Alquiler':'Rental',
  'Otro':'Other',

  'Ver vehículos':'View vehicles',
  'Añadir vehículo':'Add vehicle',
  'Crear vehículo':'Create vehicle',
  'Editar vehículo':'Edit vehicle',
  'Reemplazar vehículo':'Replace vehicle',
  'Asignar slot':'Assign slot',
  'Cambiar slot':'Change slot',
  'Liberar slot':'Release slot',
  'Selecciona slot':'Select slot',
  'Confirmar asignación':'Confirm assignment',
  'Dar de baja':'Deactivate',
  'Suspender':'Suspend',
  'Solicitar activación':'Request activation',
  'Solicitar renovación QR':'Request QR renewal',
  'Renovar QR':'Renew QR',
  'Revocar QR':'Revoke QR',
  'Código QR':'QR code',
  'QR del vehículo':'Vehicle QR',
  'QR de mi vehículo':'My vehicle QR',
  'Imprimir':'Print',
  'Descargar PNG':'Download PNG',

  'Solicitudes abiertas':'Open requests',
  'Incidencias abiertas':'Open incidents',
  'Lista de solicitudes':'Request list',
  'Lista de incidencias':'Incident list',
  'Expedientes':'Cases',
  'Expediente':'Case',
  'Cerrar expediente':'Close case',
  'Ver expediente':'View case',
  'Abrir Solicitudes':'Open Requests',
  'Histórico':'History',
  'Histórico resuelto':'Resolved history',

  'Registrar incidencia':'Record incident',
  'Registrar nueva incidencia':'Record new incident',
  'Resolver incidencia':'Resolve incident',
  'Cerrar detalle':'Close details',
  'Ver incidencia':'View incident',
  'Registrar seguimiento':'Record follow-up',
  'REGISTRAR INCIDENCIA':'RECORD INCIDENT',
  'REGISTRAR SEGUIMIENTO':'RECORD FOLLOW-UP',
  'CONFIRMAR Y CERRAR':'CONFIRM AND CLOSE',
  'RECHAZAR SOLICITUD':'REJECT REQUEST',

  'Escanear QR':'Scan QR',
  'ESCANEAR QR':'SCAN QR',
  'BUSCAR MATRÍCULA':'SEARCH PLATE',
  'INCIDENCIAS ABIERTAS':'OPEN INCIDENTS',
  'Comprobando QR…':'Checking QR…',
  'Introducir código':'Enter code',
  'Leer desde una foto':'Read from photo',
  'Reintentar cámara':'Retry camera',
  'Otra consulta':'New check',
  'ACCESO AUTORIZADO':'ACCESS AUTHORIZED',

  'Configuración':'Settings',
  'Guardar configuración':'Save settings',
  'Identidad':'Identity',
  'Colores':'Colours',
  'Principal':'Primary',
  'Secundario':'Secondary',
  'Acento':'Accent',
  'Sugerir desde logo':'Suggest from logo',
  'Sistema':'System',
  'SISTEMA':'SYSTEM',
  'Plataforma':'Platform',
  'Estado técnico':'Technical status',
  'Datos':'Data',
  'Entorno':'Environment',
  'Repositorio':'Repository',
  'Última comprobación':'Last check',
  'Actualizar estado':'Refresh status',
  'Disponible':'Available',
  'Revisar':'Review',
  'Modo mantenimiento':'Maintenance mode',
  'Mensaje visible':'Visible message',
  'Activar mantenimiento':'Enable maintenance',
  'Desactivar mantenimiento':'Disable maintenance',
  'ACTIVADO':'ENABLED',
  'DESACTIVADO':'DISABLED',

  'Importar viviendas y propietarios':'Import properties and owners',
  'Importar viviendas/propietarios':'Import properties/owners',
  'Plantilla viviendas/propietarios':'Properties/owners template',
  'Descargar plantilla':'Download template',
  'Seleccionar Excel / CSV':'Select Excel / CSV',
  'Confirmar importación':'Confirm import',
  'Crear viviendas faltantes':'Create missing properties',

  'Errores de integridad':'Integrity errors',
  'Inconsistencias':'Inconsistencies',
  'Total detectado':'Total detected',
  'Nivel':'Level',
  'Comprobación':'Check',
  'Acción':'Action',
  'Ir al registro':'Open record',
  'Corregir':'Fix',
  'Revisar nuevamente':'Check again',

  'Campo':'Field',
  'Antes':'Before',
  'Después':'After',
  'Entidad':'Entity',
  'Página':'Page',
  'registros':'records',

  'Cambiar contraseña':'Change password',
  'Contraseña actual':'Current password',
  'Nueva contraseña':'New password',

  'Sin vivienda asociada':'No associated property',
  'Sin responsable':'No responsible person',
  'Sin tipo':'No type',
  'Sin QR':'No QR',
  'No verificado':'Not verified',

  'Sí':'Yes',
  'No':'No'
};

const PARKING_UI_EN_ATTRIBUTES={
  'Buscar vivienda...':'Search property...',
  'Matrícula, temporal o vivienda...':'Plate, temporary plate or property...',
  'Matrícula, vivienda o tipo...':'Plate, property or type...',
  'Matrícula, vivienda, tipo o descripción...':'Plate, property, type or description...',
  'Matrícula, vivienda, solicitante o tipo...':'Plate, property, requester or type...',
  'Matrícula, vivienda, propietario, incidencia...':'Plate, property, owner, incident...',
  'Nombre, email, acción, entidad o valor...':'Name, email, action, entity or value...',
  'Describe lo observado...':'Describe what you observed...',
  'Describe lo observado en este nuevo intento...':'Describe what you observed during this follow-up...',
  'Qué se hizo, contacto con propietario, observaciones...':'Action taken, contact with owner, notes...',
  'Indica el motivo de la permanencia.':'Enter the reason for the long stay.',
  'Podés agregar un detalle si lo considerás necesario.':'You may add further details if needed.'
};

function uiTranslateDynamic(text){
  let value=String(text??'');

  const exact=PARKING_UI_EN_EXACT[value.trim()];
  if(exact!==undefined)return exact;

  value=value.replace(
    /^Mostrando (\d+) de (\d+)$/,
    'Showing $1 of $2'
  );

  value=value.replace(
    /^Mostrando (\d+)–(\d+) de (\d+)$/,
    'Showing $1–$2 of $3'
  );

  value=value.replace(
    /^Página (\d+) de (\d+) · (.+) de (\d+)$/,
    'Page $1 of $2 · $3 of $4'
  );

  value=value.replace(
    /^(\d+) slots ocupados$/,
    '$1 slots occupied'
  );

  value=value.replace(
    /^(\d+)\/2 slots ocupados$/,
    '$1/2 slots occupied'
  );

  value=value.replace(
    /^(\d+) libres$/,
    '$1 free'
  );

  value=value.replace(
    /^(\d+) libre$/,
    '$1 free'
  );

  value=value.replace(
    /^(\d+) vehículos$/,
    '$1 vehicles'
  );

  value=value.replace(
    /^(\d+) motos activas$/,
    '$1 active motorcycles'
  );

  value=value.replace(
    /^(\d+) incidencia\(s\)$/,
    '$1 incident(s)'
  );

  value=value.replace(
    /^(\d+) solicitud\(es\)$/,
    '$1 request(s)'
  );

  value=value.replace(
    /^(\d+) intento\(s\)$/,
    '$1 attempt(s)'
  );

  value=value.replace(
    /^Bloque (.+)$/,
    'Block $1'
  );

  value=value.replace(
    /^Desde (.+)$/,
    'From $1'
  );

  value=value.replace(
    /^Vigente hasta (.+)$/,
    'Valid until $1'
  );

  value=value.replace(
    /^Temporal vigente hasta (.+) · habitual (.+)$/,
    'Temporary plate valid until $1 · main plate $2'
  );

  value=value.replace(
    /^Solicitud abierta: (.+)$/,
    'Open request: $1'
  );

  return value;
}

function translateUiTextNode(node){
  if(
    currentLanguage()!=='en' ||
    !node ||
    node.nodeType!==Node.TEXT_NODE
  )return;

  const original=node.nodeValue||'';
  const trimmed=original.trim();

  if(!trimmed)return;

  const translated=uiTranslateDynamic(trimmed);

  if(translated===trimmed)return;

  const prefix=original.match(/^\s*/)?.[0]||'';
  const suffix=original.match(/\s*$/)?.[0]||'';

  node.nodeValue=
    prefix+translated+suffix;
}

function translateUiElement(el){
  if(
    currentLanguage()!=='en' ||
    !el ||
    el.nodeType!==Node.ELEMENT_NODE
  )return;

  if(el.tagName==='OPTION'){
    if(!el.hasAttribute('value')){
      el.setAttribute(
        'value',
        el.textContent.trim()
      );
    }
  }

  for(const attr of [
    'placeholder',
    'title',
    'aria-label'
  ]){
    const value=el.getAttribute(attr);

    if(!value)continue;

    const translated=
      PARKING_UI_EN_ATTRIBUTES[value] ??
      PARKING_UI_EN_EXACT[value] ??
      uiTranslateDynamic(value);

    if(translated!==value){
      el.setAttribute(
        attr,
        translated
      );
    }
  }

  for(const child of [...el.childNodes]){
    if(child.nodeType===Node.TEXT_NODE){
      translateUiTextNode(child);
    }
  }
}

function translateRenderedUi(root=document){
  if(currentLanguage()!=='en')return;

  if(root.nodeType===Node.ELEMENT_NODE){
    translateUiElement(root);
  }

  const container=
    root.querySelectorAll
      ? root
      : document;

  container
    .querySelectorAll('*')
    .forEach(translateUiElement);
}

let parkingI18nObserver=null;

function startParkingI18nObserver(){
  if(parkingI18nObserver)return;

  translateRenderedUi(document);

  parkingI18nObserver=
    new MutationObserver(mutations=>{
      if(currentLanguage()!=='en')return;

      for(const mutation of mutations){
        for(const node of mutation.addedNodes){
          if(node.nodeType===Node.TEXT_NODE){
            translateUiTextNode(node);
            continue;
          }

          if(node.nodeType===Node.ELEMENT_NODE){
            translateRenderedUi(node);
          }
        }

        if(
          mutation.type==='characterData' &&
          mutation.target
        ){
          translateUiTextNode(
            mutation.target
          );
        }
      }
    });

  parkingI18nObserver.observe(
    document.body,
    {
      subtree:true,
      childList:true,
      characterData:true
    }
  );
}

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

function initializeParkingI18nUi(){
  if(document.body){
    startParkingI18nObserver();
    return;
  }

  document.addEventListener(
    'DOMContentLoaded',
    startParkingI18nObserver,
    {once:true}
  );
}

initializeParkingI18nUi();
