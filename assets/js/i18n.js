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
  'Estado operativo, pendientes y elementos que requieren atención.':'Operational status, pending items and elements requiring attention.',
  'Viviendas activas':'Active properties',
  'Vehículos con slot activos':'Active vehicles with slots',
  'Motos activas':'Active motorcycles',
  'Control por matrícula':'Plate-based access control',
  'Suspendidos':'Suspended',
  'Desasignados':'Unassigned',
  'De baja':'Deactivated',
  'Slots ocupados':'Occupied slots',
  'Requieren revisión':'Require review',
  'Pendientes de resolución':'Pending resolution',
  'Incidencias con seguimiento':'Incidents with follow-up',
  'Más de un intento registrado':'More than one attempt recorded',
  'Activos sin QR válido':'Active vehicles without a valid QR',
  'No incluye motos':'Motorcycles excluded',
  'Temporales vigentes':'Active temporary plates',
  'Temporales que vencen ≤ 7 días':'Temporary plates expiring within 7 days',
  'Revisar próximos vencimientos':'Review upcoming expirations',
  'Actividad últimos 30 días':'Activity in the last 30 days',
  'Incidencias registradas':'Incidents recorded',
  'Solicitudes registradas':'Requests recorded',
  'Altas de vehículos':'Vehicles added',
  'Requiere atención':'Requires attention',
  'No hay elementos que requieran atención especial.':'No items require special attention.',
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
  'Bandeja de gestión agrupada por vehículo o matrícula observada.':'Management inbox grouped by vehicle or observed plate.',
  'Bandeja de gestión agrupada por vehículo o matrícula. Expedientes y lista comparten los mismos filtros.':'Management inbox grouped by vehicle or plate. Cases and list share the same filters.',

  'Críticas':'Critical',
  'Vehículos afectados':'Affected vehicles',
  'Intentos abiertos':'Open attempts',
  'Pendientes de resolver':'Pending resolution',
  'Abiertas con prioridad crítica':'Open with critical priority',
  'Matrículas con casos abiertos':'Plates with open cases',
  'Acumulados en incidencias abiertas':'Accumulated across open incidents',

  'Expedientes abiertos':'Open cases',
  'Viviendas afectadas':'Affected properties',
  'Solicitudes resueltas':'Resolved requests',
  'Solicitudes por resolver':'Requests pending resolution',
  'Vehículos o matrículas con solicitudes abiertas':'Vehicles or plates with open requests',
  'Con solicitudes abiertas':'With open requests',
  'Aprobadas o rechazadas':'Approved or rejected',

  'Período':'Period',
  'Todo':'All',
  'Anterior':'Previous',
  'Siguiente':'Next',

  'Exportar Excel':'Export Excel',

  'No hay expedientes que coincidan con los filtros.':'No cases match the filters.',
  'No hay incidencias.':'No incidents.',
  'No hay solicitudes.':'No requests.',

  'Crítica':'Critical',
  'Alta':'High',
  'Media':'Medium',

  'Matrícula no registrada':'Unregistered plate',
  'Acceso no autorizado':'Unauthorized access',
  'QR no presentado':'QR not presented',
  'QR no corresponde con matrícula':'QR does not match plate',
  'Uso indebido':'Misuse',
  'Vehículo inmovilizado / posible abandono':'Immobilized vehicle / possible abandonment',
  'Estacionamiento o ubicación indebida':'Improper parking or location',
  'Fuga / pérdida de líquidos':'Fluid leak or loss',

  'Activación':'Activation',
  'Renovación QR':'QR renewal',
  'Permanencia prolongada':'Extended stay',
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
  'No':'No',

  'Rol':'Role',
  'Perfiles':'Profiles',
  'Viviendas asignadas':'Assigned properties',
  'Bloque':'Block',
  'Planta':'Floor',
  'Apartamento':'Apartment',
  'Ficha':'Details',
  'Contraseña':'Password',
  'Cerrar sesiones':'Sign out sessions',
  'Reemplazar':'Replace',
  'Estado QR':'QR status',
  'Privado':'Private',

  'Editar usuarios':'Edit user',
  'Nuevo usuarios':'New user',
  'Editar viviendas':'Edit property',
  'Nuevo viviendas':'New property',
  'Vivienda y propietario':'Property and owner',
  'Ficha operativa de vivienda':'Property operational details',
  'Abrir vehículos de esta vivienda':'Open vehicles for this property',
  '← Viviendas':'← Properties',
  '＋ Vehículo':'+ Vehicle',
  '+ Vehículo':'+ Vehicle',
  '＋ Nuevo vehículo':'+ New vehicle',
  '+ Nuevo vehículo':'+ New vehicle',
  '＋ Nuevo período':'+ New period',
  '+ Nuevo período':'+ New period',
  'Períodos temporales':'Temporary plate periods',
  'Vigente':'Current',
  'Próximos':'Upcoming',
  'Históricos':'History',
  'Anulados':'Cancelled',
  'Sin períodos.':'No periods.',
  'Línea de tiempo':'Timeline',
  'La asignación se gestiona desde Viviendas mediante el propietario responsable.':'Assignment is managed from Properties through the responsible owner.',
  'Las matrículas temporales se gestionan desde el botón':'Temporary plates are managed from the vehicle\'s',
  'del vehículo y admiten varios períodos.':'button and can have multiple periods.',
  '+ Nuevo':'+ New',
  '+ Nueva':'+ New',
  '+ Añadir vehículo':'+ Add vehicle',

  'Ver vehículo':'View vehicle',
  'Este QR identifica al vehículo y valida la matrícula habitual o la temporal vigente.':'This QR identifies the vehicle and validates the main plate or the current temporary plate.',

  'Las matrículas temporales se gestionan desde el botón Temporales del vehículo y admiten varios períodos.':'Temporary plates are managed from the vehicle Temporary plates action and may contain multiple periods.',
  'Activo requiere slot. Libres: Slot 1, Slot 2':'Active status requires a slot. Available: Slot 1, Slot 2',

  'Desde':'From',
  'Hasta':'To',
  'Últimos 30 días':'Last 30 days',

  'CONFIGURACIÓN':'SETTINGS',
  'Identidad, carga inicial de datos y estado técnico del sistema.':'Identity, initial data import and system technical status.',
  'Identidad de la comunidad':'Community identity',
  'Datos generales e identidad visual. Los cambios se aplican al login y a la cabecera.':'General information and visual identity. Changes are applied to sign-in and the header.',
  'Nombre oficial':'Official name',
  'Descripción':'Description',
  'Correo de contacto':'Contact email',
  'Dirección':'Address',
  'URL del logo (opcional)':'Logo URL (optional)',
  'Gestión de acceso y parking de la comunidad':'Community access and parking management',

  'Logo':'Logo',
  'Puedes subir una imagen desde tu equipo o utilizar una URL. Se usa en el login y en la cabecera.':'You can upload an image from your device or use a URL. It is used on the sign-in screen and header.',
  'Elegir logo':'Choose logo',
  'Quitar':'Remove',

  'La prioridad sube automáticamente según la cantidad de intentos diarios registrados. El intento inicial cuenta como 1.':'Priority increases automatically according to the number of daily attempts recorded. The initial attempt counts as 1.',
  'Atención desde':'Attention from',
  'Alta desde':'High from',
  'Crítica desde':'Critical from',

  'Puedes elegirlos manualmente o sugerirlos automáticamente a partir del logo.':'You can choose them manually or generate suggestions automatically from the logo.',
  'La sugerencia no se guarda hasta pulsar “Guardar configuración”.':'The suggestion is not saved until you select “Save settings”.',

  'Importación de viviendas y propietarios':'Import properties and owners',
  'Carga inicial o actualización controlada de viviendas, propietarios y correos. La importación siempre muestra una previsualización antes de aplicar cambios.':'Initial import or controlled update of properties, owners and emails. The import always shows a preview before applying changes.',
  'La plantilla puede utilizar Viviendas existentes o crear las que falten si activas esa opción durante la importación. Los cambios se registran en Auditoría.':'The template can use existing properties or create missing ones when that option is enabled during import. Changes are recorded in Audit.',

  'Escanea, comprueba y registra en pocos segundos.':'Scan, check and record in seconds.',

  'Resumen de tus viviendas, vehículos y gestiones.':'Summary of your properties, vehicles and activity.',
  'Vivienda asociada':'Associated property',
  'Ver viviendas':'View properties',
  'Vehículos registrados':'Registered vehicles',
  'Vehículos con slot':'Vehicles with slots',
  'Permanencias autorizadas':'Authorized stays',
  'Solicitudes aprobadas':'Approved requests',
  'Mis propiedades':'My properties',
  'vivienda asociada a tu usuario':'property associated with your account',
  'Avisar permanencia':'Report extended stay',

  'Agrupar por':'Group by',
  'Sin agrupar':'Ungrouped',
  'No tienes incidencias con estos filtros.':'You have no incidents matching these filters.',
  'No tienes solicitudes con estos filtros.':'You have no requests matching these filters.'
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
  'Podés agregar un detalle si lo considerás necesario.':'You may add further details if needed.',
  'Buscar en esta sección...':'Search this section...',
  'Buscar en matrículas o vivienda...':'Search plates or property...',
  'Buscar en matrículas o vivienda…':'Search plates or property...'
};

function uiTranslateDynamic(text){
  let value=String(text??'').replace(/＋/g,'+');

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
    /^(\d+) registradas$/,
    '$1 registered'
  );

  value=value.replace(
    /^(\d+) registrados$/,
    '$1 registered'
  );

  value=value.replace(
    /^(\d+) libres de (\d+)$/,
    '$1 free of $2'
  );

  value=value.replace(
    /^= (\d+) vs\. 30 días anteriores$/,
    '= $1 vs. previous 30 days'
  );

  value=value.replace(
    /^([+-]?\d+) vs\. 30 días anteriores$/,
    '$1 vs. previous 30 days'
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

  value=value.replace(
    /^(\d+) expedientes? · (\d+) incidencias?$/,
    '$1 cases · $2 incidents'
  );

  value=value.replace(
    /^(\d+) expedientes? · (\d+) solicitudes?$/,
    '$1 cases · $2 requests'
  );

  value=value.replace(
    /^Página (\d+) de (\d+) · (\d+) registros$/,
    'Page $1 of $2 · $3 records'
  );

  value=value.replace(
    /^Página (\d+) de (\d+) · (\d+) registro$/,
    'Page $1 of $2 · $3 record'
  );

  value=value.replace(
    /^(\d+) expediente$/,
    '$1 case'
  );

  value=value.replace(
    /^(\d+) expedientes$/,
    '$1 cases'
  );

  value=value.replace(
    /^(\d+) incidencias$/,
    '$1 incidents'
  );

  value=value.replace(
    /^(\d+) solicitudes$/,
    '$1 requests'
  );

  value=value.replace(
    /^(\d+) viviendas?$/,
    '$1 properties'
  );

  value=value.replace(
    /^(\d+) vehículos registrados$/,
    '$1 registered vehicles'
  );

  value=value.replace(
    /^(\d+) slots libres$/,
    '$1 free slots'
  );

  value=value.replace(
    /^(\d+) solicitudes en total$/,
    '$1 total requests'
  );

  value=value.replace(
    /^(\d+) incidencias asociadas$/,
    '$1 associated incidents'
  );

  value=value.replace(
    /^(\d+) viviendas asignadas$/,
    '$1 assigned properties'
  );

  value=value.replace(
    /^(\d+) con slot · (\d+) motos$/,
    '$1 with slots · $2 motorcycles'
  );

  value=value.replace(
    /^CONTROL · PROPIETARIO$/,
    'Access control · Owner'
  );

  value=value.replace(
    /^PROPIETARIO$/,
    'Owner'
  );

  value=value.replace(
    /^CONTROL$/,
    'Access control'
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
    <button type="button" class="secondary compact language-option ${lang==='es'?'active':''}" data-language="es" aria-pressed="${lang==='es'}">🇪🇸 ES</button>
    <button type="button" class="secondary compact language-option ${lang==='en'?'active':''}" data-language="en" aria-pressed="${lang==='en'}">🇬🇧 EN</button>
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
