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
  },
  scanner:{
    title:'Escanear QR',
    starting:'Iniciando cámara…',
    openCamera:'▣ ABRIR CÁMARA',
    back:'← VOLVER',
    intro:'Apunta al QR. Al detectarlo, volverás automáticamente con el resultado.',
    requesting:'Solicitando permiso de cámara…',
    libraryError:'No se pudo cargar el lector QR.',
    invalidQr:'El QR leído no contiene un enlace válido.',
    detected:'QR detectado. Volviendo…',
    aiming:'Apunta al QR y mantenlo dentro del recuadro.',
    cameraError:'No se pudo iniciar la cámara automáticamente. Pulsa “ABRIR CÁMARA” y revisa el permiso si el navegador lo solicita.',
    maintenance:'Sistema temporalmente en mantenimiento.'
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
  },
  scanner:{
    title:'Scan QR code',
    starting:'Starting camera…',
    openCamera:'▣ OPEN CAMERA',
    back:'← BACK',
    intro:'Point the camera at the QR code. Once detected, you will return automatically with the result.',
    requesting:'Requesting camera permission…',
    libraryError:'The QR reader could not be loaded.',
    invalidQr:'The scanned QR code does not contain a valid link.',
    detected:'QR code detected. Returning…',
    aiming:'Point at the QR code and keep it inside the frame.',
    cameraError:'The camera could not be started automatically. Select “OPEN CAMERA” and check the permission if your browser asks for it.',
    maintenance:'The system is temporarily under maintenance.'
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
  'Imprimir QR':'Print QR',
  'Imprimir al 100% y sin encabezados/pies de página':'Print at 100% without headers/footers',
  '100% · sin encabezados/pies':'100% · no headers/footers',
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
  'No tienes solicitudes con estos filtros.':'You have no requests matching these filters.',

  /* Visual QA residuals · Admin / Owner / Control */
  'Acceso asistido':'Assisted access',
  'Generar contraseña temporal':'Generate temporary password',
  'Enviar enlace para crear/restablecer contraseña':'Send password setup/reset link',
  'El método recomendado es enviar a':'The recommended method is to send',
  'un enlace seguro para crear o restablecer su contraseña.':'a secure link to create or reset the password.',
  'Si el propietario necesita ayuda, podés generar una contraseña temporal. Se mostrará una sola vez para comunicarla manualmente y no se enviará por correo.':'If the owner needs assistance, you can generate a temporary password. It will be shown only once so it can be communicated manually and will not be sent by email.',

  'Nuevo vehículo':'New vehicle',
  'Añadir vehículo':'Add vehicle',
  'Editar vehículo':'Edit vehicle',
  'Crear vehículo':'Create vehicle',
  'Revisar y reemplazar':'Review and replace',
  'Matrícula nueva':'New plate',
  'Nueva matrícula habitual':'New main plate',
  'Marca':'Make',
  'Modelo':'Model',
  'Observaciones':'Notes',
  'Tipo':'Type',
  'Vivienda':'Property',
  'Selecciona vivienda':'Select property',
  'Particular':'Private',
  'Empresa':'Company',
  'Alquiler':'Rental',
  'Moto':'Motorcycle',
  'Otro':'Other',

  'Asignación automática de slot:':'Automatic slot assignment:',
  'El slot se asigna automáticamente.':'The slot is assigned automatically.',
  'Se utilizará el primer slot libre de la vivienda. Si los dos están ocupados, el vehículo quedará Desasignado. Las motos no ocupan slot.':'The first available slot for the property will be used. If both slots are occupied, the vehicle will remain Unassigned. Motorcycles do not use a slot.',
  'Al guardar se asignará automáticamente el Slot 1 y se generará su QR.':'When saved, Slot 1 will be assigned automatically and its QR will be generated.',
  'Los dos slots están ocupados: el vehículo quedará Desasignado.':'Both slots are occupied: the vehicle will remain Unassigned.',
  'La moto quedará Activa y no ocupará slot.':'The motorcycle will remain Active and will not use a slot.',

  'Los períodos de matrícula temporal se gestionan desde Temporales. Para cambiar entre moto y vehículo con slot, contacta con administración.':'Temporary plate periods are managed from Temporary plates. To change between a motorcycle and a slotted vehicle, contact the administrator.',

  'Ficha del vehículo':'Vehicle details',
  'Clase / tipo':'Class / type',
  'Solicitudes':'Requests',
  'Expediente de solicitudes asociado a este vehículo.':'Request history associated with this vehicle.',
  'Abrir Solicitudes':'Open Requests',
  'Este vehículo todavía no tiene solicitudes registradas.':'This vehicle does not have any requests yet.',
  'Última actividad':'Last activity',

  'Buscar matrícula':'Search plate',
  'Buscar':'Search',
  'Control de acceso':'Access control',
  'Comprobando el código escaneado.':'Checking the scanned code.',
  'Comprobando QR…':'Checking QR…',
  'Validando vehículo y autorización de acceso.':'Validating vehicle and access authorization.',
  'Volver':'Back',
  'Reintentar cámara':'Retry camera',
  'Leer desde una foto':'Read from a photo',
  'Introducir código':'Enter code',
  'Apunta al QR y mantenlo dentro del recuadro.':'Point at the QR code and keep it inside the frame.',

  'Situación detectada por Control':'Situation detected by Access Control',
  'Registro manual':'Manual entry',
  'Situación':'Situation',
  'Posible abandono':'Possible abandonment',
  'Vehículo inmovilizado':'Immobilized vehicle',
  'Avería prolongada':'Prolonged breakdown',
  'ITV vencida':'Expired vehicle inspection',
  'Fuga / pérdida de líquidos':'Fluid leak or loss',
  'Observación *':'Observation *',
  'Foto / evidencia *':'Photo / evidence *',
  'Obligatoria tanto para una nueva incidencia como para un seguimiento.':'Required for both a new incident and a follow-up.',

  'Mis viviendas':'My properties',
  'Mis vehículos':'My vehicles',
  'ocupados':'occupied',
  'libres':'free',
  'Vehículo':'Vehicle',
  'Sin slot':'No slot',
  'No aplica':'Not applicable',
  'Temporales':'Temporary plates',

  'Solicitar permanencia prolongada':'Request extended stay',
  'La solicitud debe ser aprobada por administración. Una vez aprobada, Control verá que la permanencia está autorizada durante el período indicado.':'The request must be approved by the administrator. Once approved, Access Control will see that the stay is authorized for the specified period.',
  'Fecha inicio':'Start date',
  'Fecha fin prevista':'Expected end date',
  'Motivo de permanencia':'Reason for stay',
  'Detalle del motivo':'Reason details',
  'Detalle del motivo (opcional)':'Reason details (optional)',
  'Viaje prolongado':'Extended trip',
  'Vehículo inmovilizado':'Immobilized vehicle',
  'Enviar solicitud':'Submit request',

  'El vehículo actual quedará de baja. El nuevo quedará registrado sin slot.':'The current vehicle will be deactivated. The new vehicle will be registered without a slot.',
  'El vehículo actual pasará a Baja, su QR quedará revocado y cualquier temporal vigente será anulado. El nuevo vehículo conservará la misma vivienda. Si corresponde, conservará el slot liberado.':'The current vehicle will be Deactivated, its QR will be revoked and any current temporary plate will be cancelled. The new vehicle will remain assigned to the same property and, where applicable, keep the released slot.',

  'Anterior':'Previous',
  'Siguiente':'Next'
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

Object.assign(PARKING_UI_EN_EXACT,{
  'Búsqueda global':'Global search',
  'La plantilla puede utilizar viviendas existentes o crear las que falten si activas esa opción durante la importación. Los cambios se registran en Auditoría.':'The template can use existing properties or create missing ones when that option is enabled during import. Changes are recorded in Audit.',
  'Puedes pegar una URL o subir un archivo desde el panel de Logo':'You can paste a URL or upload a file from the Logo panel',
  'Matrícula asociada al QR':'Plate linked to the QR code',
  'Los dos slots están ocupados: el vehículo quedará':'Both slots are occupied: the vehicle will remain',
  'Busca matrículas, viviendas, propietarios, incidencias y solicitudes.':'Search plates, properties, owners, incidents and requests.',
  'Matrículas, viviendas, propietarios, incidencias y solicitudes.':'Plates, properties, owners, incidents and requests.',
  'Abrir':'Open',
  'Solo muestra incoherencias de datos. Los pendientes operativos se gestionan desde Resumen.':'Only data inconsistencies are shown. Operational pending items are managed from Overview.',
  'El vehículo actual pasará a':'The current vehicle will become',
  'Última solicitud:':'Latest request:',
  'PNG, JPG, WEBP o GIF. Máximo 6 MB.':'PNG, JPG, WEBP or GIF. Maximum 6 MB.',
  'Comprobando plataforma, mantenimiento e integraciones.':'Checking platform, maintenance and integrations.',
  'Comprobando sistema…':'Checking system…',
  'Copia automática de la base de datos en Google Drive.':'Automatic database backup to Google Drive.',
  'Último backup':'Latest backup',
  'Abrir último backup':'Open latest backup',
  'Estado real de la aplicación Supabase publicada en GitHub Pages.':'Live status of the Supabase application published on GitHub Pages.',
  'Base de datos, autenticación, RLS y Edge Functions.':'Database, authentication, RLS and Edge Functions.',
  'ROOT técnico':'Technical ROOT',
  'Auditoría histórica':'Historical audit',
  'Auditoría total':'Total audit',
  'Bloquea la aplicación y el escáner para usuarios normales durante el cutover. ROOT conserva el acceso.':'Blocks the application and scanner for regular users during cutover. ROOT retains access.',
  'El cambio queda registrado en Auditoría.':'The change is recorded in Audit.',
  'Ejecutar diagnóstico':'Run diagnostics',
  'Sin comprobación ejecutada.':'No check has been run.',
  'Diagnóstico':'Diagnostics',
  'Comprueba Supabase Auth, RLS, base de datos y Edge Functions. No envía correos ni modifica datos.':'Checks Supabase Auth, RLS, the database and Edge Functions. It does not send email or modify data.',
  'Prueba rápida':'Quick test',
  'Diagnóstico completo':'Full diagnostics',
  'Selecciona una comprobación.':'Select a check.',
  'Llamadas de esta sesión':'Calls in this session',
  'Resumen de llamadas realizadas por este navegador.':'Summary of calls made by this browser.',
  'Ejecutando diagnóstico…':'Running diagnostics…',
  'Las reglas de consistencia no detectaron incidencias.':'The consistency rules found no issues.',
  'Todavía no hay llamadas registradas.':'No calls have been recorded yet.',
  'No hay errores registrados en las últimas operaciones.':'No errors were recorded in recent operations.',
  'Limpiar métricas':'Clear metrics',
  'Éxito':'Success',
  'Últimos errores':'Recent errors',
  'Selecciona al menos un vehículo.':'Select at least one vehicle.',
  'La selección no contiene vehículos con QR activo disponible.':'The selection does not contain vehicles with an active QR available.',
  'Se omitieron vehículos sin QR activo.':'Vehicles without an active QR were skipped.',
  'Colores sugeridos desde el logo.':'Colours suggested from the logo.',
  'Configuración guardada.':'Settings saved.',
  '¿Ejecutar ahora una copia completa de Supabase en Google Drive?':'Run a full Supabase backup to Google Drive now?',
  '¿Activar modo mantenimiento? Los usuarios normales y el escáner quedarán bloqueados hasta que ROOT lo desactive.':'Enable maintenance mode? Regular users and the scanner will remain blocked until ROOT disables it.',
  'Se ejecutarán lotes de 5, 10 y 20 lecturas simultáneas desde este navegador. ¿Continuar?':'Batches of 5, 10 and 20 concurrent reads will run from this browser. Continue?',
  '¿Limpiar las métricas técnicas guardadas en este navegador?':'Clear the technical metrics stored in this browser?',
  'Logo subido. Pulsa “Guardar configuración” para aplicarlo.':'Logo uploaded. Select “Save settings” to apply it.',
  'El logo se quitará al guardar la configuración.':'The logo will be removed when settings are saved.',
  'Colores sugeridos desde el logo. Revísalos y guarda para aplicarlos.':'Colours suggested from the logo. Review and save them to apply the changes.',
  'Últimos 7 días':'Last 7 days',
  'Mes anterior':'Previous month',
  'No hay registros para los filtros seleccionados.':'No records match the selected filters.',
  '← Anterior':'← Previous',
  'Siguiente →':'Next →',
  'Situación:':'Situation:',
  'Matrícula observada:':'Observed plate:',
  'Matrícula asociada al QR:':'Plate linked to the QR code:',
  'Fuga / pérdida':'Leak / loss',
  'Situación detectada':'Detected situation',
  'Vehículo vinculado':'Linked vehicle',
  'Tipo vehículo':'Vehicle type',
  'Estado actual':'Current status',
  'Estado al crear':'Status when created',
  'Estado al solicitar':'Status when requested',
  'Slot actual':'Current slot',
  'Slot origen':'Original slot',
  'Acción de cierre:':'Closing action:',
  'Acción realizada':'Action taken',
  'Acción realizada:':'Action taken:',
  'Ver detalle':'View details',
  'Vehículos relacionados:':'Related vehicles:',
  'No hay incidencias abiertas.':'No open incidents.',
  'No hay incidencias resueltas.':'No resolved incidents.',
  'Selecciona la acción realizada.':'Select the action taken.',
  'Incidencia resuelta y cerrada.':'Incident resolved and closed.',
  'Optimizando fotografía…':'Optimising photo…',
  'Debes adjuntar una fotografía antes de registrar la incidencia.':'You must attach a photo before recording the incident.',
  'Indica la matrícula realmente observada.':'Enter the plate that was actually observed.',
  'La matrícula observada debe ser distinta de la asociada al QR.':'The observed plate must be different from the plate linked to the QR code.',
  'Carga viviendas, propietarios y emails en una única operación. Los usuarios nuevos se crean como PROPIETARIO activo y sin contraseña.':'Import properties, owners and email addresses in one operation. New users are created as active OWNER accounts without a password.',
  'Desactivado: solo actualiza viviendas ya existentes. Activado: da de alta las que no encuentre.':'Disabled: only updates existing properties. Enabled: creates missing properties.',
  'Esta vivienda todavía no tiene vehículos registrados.':'This property does not have any registered vehicles yet.',
  'Contraseña temporal generada.':'Temporary password generated.',
  'Copiala ahora. No quedará visible después de cerrar esta pantalla.':'Copy it now. It will no longer be visible after this screen is closed.',
  'Uno o dos perfiles. Se admite ADMIN + PROPIETARIO o CONTROL + PROPIETARIO; no ADMIN + CONTROL.':'One or two profiles. ADMIN + OWNER or ACCESS CONTROL + OWNER are allowed; ADMIN + ACCESS CONTROL is not.',
  'La moto quedará':'The motorcycle will remain',
  'Al guardar se asignará automáticamente el':'When saved, the following will be assigned automatically:',
  'Los dos slots están ocupados. El vehículo quedará':'Both slots are occupied. The vehicle will remain',
  'Este vehículo no tiene un QR válido. Debe estar Activo y con QR Activo.':'This vehicle does not have a valid QR code. It must be Active with an Active QR code.',
  'Contraseña copiada.':'Password copied.',
  'No se pudo copiar automáticamente.':'It could not be copied automatically.',
  'Selecciona uno o dos perfiles.':'Select one or two profiles.',
  'ADMIN + CONTROL no es una combinación permitida.':'ADMIN + ACCESS CONTROL is not an allowed combination.',
  'Datos guardados.':'Data saved.',
  'Las motos se controlan por matrícula y no utilizan QR.':'Motorcycles are checked by plate and do not use QR codes.',
  'El QR anterior dejará de ser válido. ¿Continuar?':'The previous QR code will no longer be valid. Continue?',
  'El QR anterior dejará de ser válido. ¿Generar uno nuevo?':'The previous QR code will no longer be valid. Generate a new one?',
  'El QR quedará revocado y dejará de autorizar accesos. ¿Continuar?':'The QR code will be revoked and will no longer authorize access. Continue?',
  'Desasignado: registrado sin slot y sin QR.':'Unassigned: registered without a slot or QR code.',
  'Suspendido/Baja: sin slot y sin QR asignado. La vuelta al circuito requiere una solicitud de activación aprobada.':'Suspended/Deactivated: no slot or QR code assigned. Returning to the access process requires an approved activation request.',
  'Las motos no ocupan slot y se controlan por matrícula.':'Motorcycles do not use a slot and are checked by plate.',
  'Motivo:':'Reason:',
  'Resolución:':'Resolution:',
  'EXPEDIENTE DE SOLICITUDES':'REQUEST CASE',
  'Ver ficha del vehículo':'View vehicle details',
  'No hay solicitudes abiertas para este vehículo.':'There are no open requests for this vehicle.',
  'Todavía no hay solicitudes resueltas.':'There are no resolved requests yet.',
  'Observaciones de resolución (opcional):':'Resolution notes (optional):',
  'Motivo del rechazo (opcional):':'Rejection reason (optional):',
  '¿Rechazar esta solicitud? No se modificará el vehículo.':'Reject this request? The vehicle will not be modified.',
  'Solicitud rechazada.':'Request rejected.',
  '⌕ BUSCAR MATRÍCULA':'⌕ SEARCH PLATE',
  '! INCIDENCIAS ABIERTAS':'! OPEN INCIDENTS',
  '▣ ESCANEAR QR':'▣ SCAN QR',
  '+ REGISTRAR INCIDENCIA':'+ RECORD INCIDENT',
  'No se pudo iniciar la cámara en directo. Revisa el permiso del navegador o usa “Leer desde una foto”.':'The live camera could not be started. Check the browser permission or use “Read from a photo”.',
  'Al registrar el seguimiento se reevaluará el evento completo. Si la matrícula observada corresponde a otro vehículo, las incidencias existentes recibirán seguimiento y las patas nuevas se crearán como incidencias nuevas.':'Recording the follow-up will re-evaluate the entire event. If the observed plate belongs to another vehicle, existing incidents will receive a follow-up and new branches will be created as new incidents.',
  'Temporal vigente:':'Current temporary plate:',
  'La fotografía del seguimiento es obligatoria.':'A follow-up photo is required.',
  '7 días':'7 days',
  '30 días':'30 days',
  'Estado vehículo':'Vehicle status',
  'Este QR no está disponible.':'This QR code is not available.',
  'Los períodos de matrícula temporal se gestionan desde':'Temporary plate periods are managed from',
  'Se asignará automáticamente el':'The following will be assigned automatically:',
  'Mínimo 8 caracteres, con una letra y un número.':'Minimum 8 characters, including one letter and one number.',
  'No tienes viviendas asignadas.':'You have no assigned properties.',
  'No hay vehículos que coincidan con los filtros.':'No vehicles match the filters.',
  'Ver fotografía':'View photo',
  'No tienes viviendas asociadas.':'You have no associated properties.',
  'Vehículo actualizado.':'Vehicle updated.',
  'No hay viviendas activas disponibles.':'There are no active properties available.',
  'Vehículo dado de baja.':'Vehicle deactivated.',
  'Ya existe una solicitud abierta de este tipo.':'An open request of this type already exists.',
  'Este vehículo no está en un estado que permita solicitar activación.':'This vehicle is not in a status that allows an activation request.',
  'Este vehículo no puede ocupar un slot.':'This vehicle cannot use a slot.',
  'Slot liberado.':'Slot released.',
  'Vehículo reemplazado.':'Vehicle replaced.',
  'Ya existe una solicitud de permanencia abierta para este vehículo.':'An open extended-stay request already exists for this vehicle.',
  'Para Otro tenés que indicar el detalle del motivo.':'For Other, you must enter the reason details.',
  'La fecha fin no puede ser anterior a la fecha inicio.':'The end date cannot be earlier than the start date.',
  'Solicitud de permanencia enviada a administración.':'Extended-stay request sent to the administrator.',
  'Datos actualizados.':'Details updated.',
  'Contraseña actualizada.':'Password updated.',
  'Selecciona una vivienda para añadir el vehículo.':'Select a property before adding the vehicle.',
  'Anular':'Cancel',
  'Nueva fecha hasta':'New end date',
  'Observación (opcional)':'Note (optional)',
  'Confirmar prórroga':'Confirm extension',
  'TEMPORAL VIGENTE':'CURRENT TEMPORARY PLATE',
  'Abrir solicitud':'Open request',
  'Abrir incidencia':'Open incident',
  'Motivo de la prórroga':'Reason for extension',
  'Período guardado.':'Period saved.',
  'Temporal prorrogado.':'Temporary plate period extended.',
  'Período anulado.':'Period cancelled.'
});

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
    /^Acceso de (.+)$/,
    'Access for $1'
  );

  value=value.replace(
    /^Viviendas asignadas(.*)$/,
    'Assigned properties$1'
  );

  value=value.replace(
    /^(.+)\s+¿Confirmar operación\?$/,
    '$1 Confirm operation?'
  );

  value=value.replace(
    /^REEMPLAZO DE VEHÍCULO\s+Anterior: (.+) → Baja\s+Nuevo: (.+)\s+(.+)\s+(.+)\s+¿Confirmar\?$/,
    'VEHICLE REPLACEMENT Previous: $1 → Deactivated New: $2 $3 $4 Confirm?'
  );

  value=value.replace(
    /^(.+)\s+¿Confirmar\?$/,
    '$1 Confirm?'
  );

  value=value.replace(
    /^(.+) vehículo\(s\) actualizados\.$/,
    '$1 vehicle(s) updated.'
  );

  value=value.replace(
    /^(.+)\. Se registrará en Auditoría\. ¿Continuar\?$/,
    '$1. The action will be recorded in Audit. Continue?'
  );

  value=value.replace(
    /^Vehículo reemplazado por (.+)\.$/,
    'Vehicle replaced with $1.'
  );

  value=value.replace(
    /^Vehículo (.+)\.$/,
    'Vehicle $1.'
  );

  value=value.replace(
    /^¿Cerrar todas las sesiones activas de (.+)\?$/,
    'Sign out all active sessions for $1?'
  );

  value=value.replace(
    /^¿Enviar a (.+) un enlace para crear\/restablecer su contraseña\?$/,
    'Send $1 a link to create or reset their password?'
  );

  value=value.replace(
    /^¿Generar una contraseña temporal para (.+)\?\s+La contraseña actual dejará de ser válida\.$/,
    'Generate a temporary password for $1? The current password will no longer be valid.'
  );

  value=value.replace(
    /^Importación completada: (.+)$/,
    'Import completed: $1'
  );

  value=value.replace(
    /^(.+)\.\s+(.+)\s+Objetivo: (.+)\.\s+¿Confirmar y cerrar la incidencia\?$/,
    '$1. $2 Target: $3. Confirm and close the incident?'
  );

  value=value.replace(
    /^Ya existe una incidencia abierta equivalente:\s+(.+)\s+¿Registrar el intento de hoy como seguimiento\?$/,
    'An equivalent open incident already exists: $1 Record today’s attempt as a follow-up?'
  );

  value=value.replace(
    /^(.+) de (.+)\.\s+(.+)\s+¿Continuar\?$/,
    '$1 for $2. $3 Continue?'
  );

  value=value.replace(
    /^El Slot (.+) está asignado a (.+)\. ¿Liberarlo y asignarlo a (.+)\? El vehículo anterior quedará Desasignado y no se transferirá su QR\.$/,
    'Slot $1 is assigned to $2. Release it and assign it to $3? The previous vehicle will become Unassigned and its QR code will not be transferred.'
  );

  value=value.replace(
    /^¿Liberar el Slot (.+) de (.+)\? El vehículo quedará registrado pero sin QR asociado\.$/,
    'Release Slot $1 from $2? The vehicle will remain registered without an associated QR code.'
  );

  value=value.replace(
    /^¿Confirmar el reemplazo de (.+) por (.+)\?$/,
    'Confirm replacement of $1 with $2?'
  );

  value=value.replace(
    /^Prorrogar (.+) hasta (.+)\. ¿Continuar\?$/,
    'Extend $1 until $2. Continue?'
  );

  value=value.replace(
    /^¿Anular el período (.+) del (.+) al (.+)\?$/,
    'Cancel the $1 period from $2 to $3?'
  );

  value=value.replace(
    /^Se muestran las (.+) más recientes de (.+)\.$/,
    'Showing the $1 most recent of $2.'
  );

  value=value.replace(
    /^Vehículos relacionados \((.+)\):$/,
    'Related vehicles ($1):'
  );

  value=value.replace(
    /^(.+) incidencias en este intento$/,
    '$1 incidents in this attempt'
  );

  value=value.replace(
    /^(.+) simultáneas$/,
    '$1 concurrent'
  );

  value=value.replace(
    /^Últimas (.+) operaciones conservadas en este dispositivo$/,
    'Last $1 operations stored on this device'
  );

  value=value.replace(
    /^(.+) llamada(.+) · media (.+) ms · P95 (.+) ms · máx\. (.+) ms (.+)$/,
    '$1 call$2 · average $3 ms · P95 $4 ms · max. $5 ms $6'
  );

  value=value.replace(
    /^(.+) fila(.+) válida(.+)$/,
    '$1 valid row$2$3'
  );

  value=value.replace(
    /^Buscar en (.+)$/,
    'Search $1'
  );

  value=value.replace(
    /^(.+) slot · (.+)$/,
    '$1 slot · $2'
  );

  value=value.replace(
    /^(.+) incidencia(.+)$/,
    '$1 incident$2'
  );

  value=value.replace(
    /^(.+) solicitud(.+)$/,
    '$1 request$2'
  );

  value=value.replace(
    /^(\d+)\/2 ocupados · (\d+) libres$/,
    '$1/2 occupied · $2 free'
  );

  value=value.replace(
    /^(\d+) vivienda asociada a tu usuario$/,
    '$1 property associated with your account'
  );

  value=value.replace(
    /^(\d+) viviendas asociadas a tu usuario$/,
    '$1 properties associated with your account'
  );

  value=value.replace(
    /^Reemplazar vehículo · (.+)$/,
    'Replace vehicle · $1'
  );

  value=value.replace(
    /^Solicitar permanencia prolongada · (.+)$/,
    'Request extended stay · $1'
  );

  value=value.replace(
    /^Ficha del vehículo · (.+)$/,
    'Vehicle details · $1'
  );

  value=value.replace(
    /^Incidencias abiertas \((\d+)\)$/,
    'Open incidents ($1)'
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

const parkingI18nTextState=new WeakMap();
const parkingI18nAttributeState=new WeakMap();

function parkingDictionaryPairs(){
  const pairs=[];
  const visit=(es,en)=>{
    for(const key of Object.keys(es||{})){
      if(
        es[key] &&
        typeof es[key]==='object' &&
        !Array.isArray(es[key])
      ){
        visit(es[key],en?.[key]);
        continue;
      }
      if(typeof en?.[key]==='string'){
        pairs.push([en[key],String(es[key])]);
      }
    }
  };
  visit(PARKING_I18N.es,PARKING_I18N.en);
  Object.entries(PARKING_UI_EN_EXACT).forEach(([es,en])=>{
    pairs.push([en,es]);
  });
  return pairs.sort((a,b)=>b[0].length-a[0].length);
}

const PARKING_UI_ES_REVERSE=new Map(parkingDictionaryPairs());

function uiTranslateToSpanish(text){
  const value=String(text??'');
  return PARKING_UI_ES_REVERSE.get(value.trim())??value;
}

function uiText(text){
  const value=String(text??'');
  return currentLanguage()==='en'
    ? uiTranslateDynamic(value)
    : uiTranslateToSpanish(value);
}

const PARKING_NATIVE_DIALOGS=typeof window==='undefined'
  ? {}
  : {
      alert:window.alert?.bind(window),
      confirm:window.confirm?.bind(window),
      prompt:window.prompt?.bind(window)
    };

function uiAlert(message){
  return PARKING_NATIVE_DIALOGS.alert?.(uiText(message));
}

function uiConfirm(message){
  return PARKING_NATIVE_DIALOGS.confirm?.(uiText(message));
}

function uiPrompt(message,defaultValue=''){
  return PARKING_NATIVE_DIALOGS.prompt?.(
    uiText(message),
    defaultValue
  );
}

if(typeof window!=='undefined'){
  window.alert=uiAlert;
  window.confirm=uiConfirm;
  window.prompt=uiPrompt;
}

function translateUiTextNode(node){
  if(!node || node.nodeType!==Node.TEXT_NODE)return;

  const current=node.nodeValue||'';
  const trimmed=current.trim();
  if(!trimmed)return;

  if(currentLanguage()!=='en'){
    const saved=parkingI18nTextState.get(node);
    if(!saved)return;
    const original=saved.original;
    const prefix=current.match(/^\s*/)?.[0]||'';
    const suffix=current.match(/\s*$/)?.[0]||'';
    const restored=uiTranslateToSpanish(original);
    if(restored!==trimmed)node.nodeValue=prefix+restored+suffix;
    parkingI18nTextState.delete(node);
    return;
  }

  const saved=parkingI18nTextState.get(node);
  if(saved && trimmed===saved.translated)return;

  const original=trimmed;
  const translated=uiTranslateDynamic(original);
  if(translated===original)return;
  parkingI18nTextState.set(node,{original,translated});

  const prefix=current.match(/^\s*/)?.[0]||'';
  const suffix=current.match(/\s*$/)?.[0]||'';
  node.nodeValue=prefix+translated+suffix;
}

function translateUiElement(el){
  if(!el || el.nodeType!==Node.ELEMENT_NODE)return;

  if(el.tagName==='OPTION'){
    if(!el.hasAttribute('value')){
      el.setAttribute(
        'value',
        el.textContent.trim()
      );
    }
  }

  const savedAttributes=parkingI18nAttributeState.get(el)||{};

  for(const attr of [
    'placeholder',
    'title',
    'aria-label'
  ]){
    const value=el.getAttribute(attr);

    if(!value)continue;

    if(currentLanguage()!=='en'){
      if(!savedAttributes[attr])continue;
      const original=savedAttributes[attr];
      el.setAttribute(attr,uiTranslateToSpanish(original));
      continue;
    }

    const original=savedAttributes[attr]??value;

    const translated=
      PARKING_UI_EN_ATTRIBUTES[original] ??
      PARKING_UI_EN_EXACT[original] ??
      uiTranslateDynamic(original);

    if(translated!==value){
      savedAttributes[attr]=original;
      el.setAttribute(
        attr,
        translated
      );
    }
  }

  parkingI18nAttributeState.set(el,savedAttributes);

  const responsiveLabel=el.getAttribute('data-label');
  if(responsiveLabel){
    if(currentLanguage()==='en'){
      el.setAttribute(
        'data-i18n-label',
        uiTranslateDynamic(responsiveLabel)
      );
    }else{
      el.removeAttribute('data-i18n-label');
    }
  }

  for(const child of [...el.childNodes]){
    if(child.nodeType===Node.TEXT_NODE){
      translateUiTextNode(child);
    }
  }
}

function translateRenderedUi(root=document){
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

function setParkingLanguage(language,{reload=false}={}){
  if(language!=='es'&&language!=='en')return false;

  PARKING_LANGUAGE=language;

  try{
    localStorage.setItem(
      PARKING_LANGUAGE_KEY,
      language
    );
  }catch(_e){}

  document.documentElement.lang=language;

  if(reload){
    location.reload();
    return true;
  }

  translateRenderedUi(document);
  bindLanguageSelectors(document);
  window.dispatchEvent(
    new CustomEvent(
      'parking:languagechange',
      {detail:{language}}
    )
  );

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
    button.onclick=()=>{
      setParkingLanguage(button.dataset.language);
    };
    const active=button.dataset.language===currentLanguage();
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
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
