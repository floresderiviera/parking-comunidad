'use strict';

export function createRouter({
    runtime,
    authApi,
    profileApi,
    temporaryPeriodsApi,
    vehiclesApi,
    usersApi,
    auditApi,
    housingApi,
    requestsApi,
    evidenceApi,
    incidentsApi,
    controlApi,
    dashboardApi,
    ownerApi,
    searchApi,
    settingsApi,
    systemApi,
    adminUsersApi,
    adminImportApi,
    adminDataApi,
    referenceData
  }) {
    const {
      sb,
      unwrap,
      invalidate,
      publicAppState,
      appBootstrap
    } = runtime;

    async function edgeFunctionError(
      error,
      fallback
    ) {
      try {
        const context =
          error?.context?.clone
            ? error.context.clone()
            : error?.context;

        const payload =
          await context?.json?.();

        const message =
          String(
            payload?.error ||
            payload?.message ||
            ''
          ).replace(/^Error:\s*/, '');

        if (message) return message;
      } catch (_) {}

      return error?.message || fallback;
    }

    const {
      listTemporaryPeriods,
      saveTemporaryPeriod,
      extendTemporaryPeriod,
      deleteTemporaryPeriod
    } = temporaryPeriodsApi;

    const {
      listVehicles,
      saveVehicle,
      renewQr,
      replaceVehicle,
      assignVehicleSlot,
      releaseVehicleSlot,
      bulkVehiclePreview,
      bulkVehicleAction
    } = vehiclesApi;

    const {
      listUsers,
      formOptions
    } = usersApi;

    const {
      listAudit
    } = auditApi;

    const {
      listHousing,
      saveHousing
    } = housingApi;

    const {
      listRequests,
      createRequest,
      resolveRequest
    } = requestsApi;

    const {
      uploadPhoto
    } = evidenceApi;

    const {
      listIncidents,
      saveIncident,
      previewIncidentFollowup,
      saveIncidentFollowup
    } = incidentsApi;

    const {
      parkingControl
    } = controlApi;

    const {
      dashboard
    } = dashboardApi;

    const {
      ownerBundle
    } = ownerApi;

    const {
      globalSearch
    } = searchApi;

    const {
      closeIncident,
      housingDetail,
      vehicleHistory
    } = referenceData;

    async function action(
      name,
      payload = {}
    ) {
      if (
        name !== 'bootstrap' &&
        !name.startsWith('system')
      ) {
        const publicState =
          await publicAppState();

        if (
          publicState
            ?.maintenance
            ?.enabled
        ) {
          const boot =
            await appBootstrap();

          if (!boot.user.IsRoot) {
            throw new Error(
              publicState
                .maintenance
                .message ||
              'Sistema temporalmente en mantenimiento.'
            );
          }
        }
      }

      switch (name) {
        case 'bootstrap':
          return appBootstrap();

        case 'dashboard':
          return dashboard();

        case 'listUsers':
          return listUsers();

        case 'listHousing':
          return listHousing();

        case 'listVehicles':
          return listVehicles();

        case 'formOptions':
          return formOptions();

        case 'listRequests':
          return listRequests();

        case 'listIncidents':
        case 'listIncidentsPayload':
          return {
            rows:
              await listIncidents(),
            complianceRules:
              await settingsApi.getComplianceRules()
          };

        case 'listAudit':
          return listAudit();

        case 'ownerBundle':
          return ownerBundle();

        case 'scanQr':
          return parkingControl(
            'QR',
            payload.token
          );

        case 'searchPlate':
          return parkingControl(
            'MATRICULA',
            payload.plate
          );

        case 'uploadPhoto':
          return uploadPhoto(
            payload
          );

        case 'saveIncident':
          return saveIncident(
            payload
          );

        case 'saveIncidentFollowup':
          return saveIncidentFollowup(
            payload
          );

        case 'previewIncidentFollowup':
          return previewIncidentFollowup(
            payload
          );

        case 'closeIncident':
          return closeIncident(
            payload
          );

        case 'saveVehicle':
          return saveVehicle(
            payload
          );

        case 'saveHousing':
          return saveHousing(
            payload
          );

        case 'listTemporaryPeriods':
          return listTemporaryPeriods(
            payload
          );

        case 'saveTemporaryPeriod':
          return saveTemporaryPeriod(
            payload
          );

        case 'extendTemporaryPeriod':
          return extendTemporaryPeriod(
            payload
          );

        case 'deleteTemporaryPeriod':
          return deleteTemporaryPeriod(
            payload
          );

        case 'assignVehicleSlot':
          return assignVehicleSlot(
            payload
          );

        case 'releaseVehicleSlot':
          return releaseVehicleSlot(
            payload
          );

        case 'bulkVehiclePreview':
          return bulkVehiclePreview(
            payload
          );

        case 'bulkVehicleAction':
          return bulkVehicleAction(
            payload
          );

        case 'renewQr':
          return renewQr(
            payload
          );

        case 'replaceVehicle':
          return replaceVehicle(
            payload
          );

        case 'createRequest':
          return createRequest(
            payload
          );

        case 'resolveRequest':
          return resolveRequest(
            payload
          );

        case 'getSettings':
          return settingsApi
            .getSettings();

        case 'getComplianceRules':
          return settingsApi
            .getComplianceRules();

        case 'saveComplianceRules':
          return settingsApi
            .saveComplianceRules(payload);

        case 'saveSettings':
          return settingsApi
            .saveSettings(
              payload
            );

        case 'ownerImportTemplate':
          return adminImportApi
            .ownerImportTemplate();

        case 'previewOwnerImport':
          return adminImportApi
            .previewOwnerImport(
              payload
            );

        case 'applyOwnerImport':
          return adminImportApi
            .applyOwnerImport(
              payload
            );

        case 'consistencyReport':
          return settingsApi
            .consistencyReport();

        case 'consistencyFix':
          return settingsApi
            .consistencyFix(
              payload
            );

        case 'uploadLogo':
          return settingsApi
            .uploadLogo(
              payload
            );

        case 'globalSearch':
          return globalSearch(
            payload
          );

        // parking_official_pdf_single_button_v1: issue a short-lived signed URL via server-side authorization.
        case 'downloadIncidentPdf': {
          const boot=await appBootstrap();
          if(!boot.user.IsRoot&&!boot.roles.includes('ADMIN'))throw new Error('ADMIN requerido.');
          const response=await sb.functions.invoke('parking-notifications',{
            body:{action:'download-official-pdf',incident_id:payload.id}
          });
          if(response.error)throw new Error(await edgeFunctionError(response.error,'No se pudo consultar el PDF oficial.'));
          if(response.data?.error)throw new Error(response.data.error);
          if(response.data?.missing)return response.data;
          if(!response.data?.url)throw new Error('El PDF oficial no está disponible.');
          // parking_official_pdf_browser_origin_v2: Supabase Storage can sign using Docker's internal 'kong' host.
          // Keep the signed path and token unchanged; use only the public API origin configured for this client.
          const publicBase=new URL(sb.supabaseUrl);
          const signed=new URL(response.data.url,publicBase);
          if(!signed.pathname.startsWith('/storage/v1/object/sign/')){
            throw new Error('Ruta del PDF oficial no autorizada.');
          }
          signed.protocol=publicBase.protocol;
          signed.host=publicBase.host;
          return {...response.data,url:signed.href};
        }

        case 'uploadIncidentPdf': {
          const boot=await appBootstrap();
          if(!boot.user.IsRoot&&!boot.roles.includes('ADMIN'))throw new Error('ADMIN requerido.');
          const response=await sb.functions.invoke('parking-notifications',{
            body:{action:'upload-pdf',incident_id:payload.id,audience:payload.audience,pdf_base64:payload.pdfBase64}
          });
          if(response.error)throw new Error(await edgeFunctionError(response.error,'No se pudo preparar el PDF oficial.'));
          if(response.data?.error)throw new Error(response.data.error);
          return response.data;
        }

        case 'weeklyManualReport': {
          const boot=await appBootstrap();
          if(!boot.user.IsRoot&&!boot.roles.includes('ADMIN'))throw new Error('ADMIN requerido.');
          const response=await sb.functions.invoke('parking-notifications',{
            body:{action:'weekly-manual',community_id:boot.communityId}
          });
          if(response.error)throw response.error;
          if(response.data?.error)throw new Error(response.data.error);
          return response.data;
        }

        case 'downloadWeeklyReport': {
          const boot=await appBootstrap();
          if(!boot.user.IsRoot&&!boot.roles.includes('ADMIN'))throw new Error('ADMIN requerido.');
          const response=await sb.functions.invoke('parking-notifications',{
            body:{action:'download-weekly-report',community_id:boot.communityId,period_start:payload.period_start,period_end:payload.period_end}
          });
          if(response.error)throw response.error;
          if(response.data?.error)throw new Error(response.data.error);
          if(!response.data?.url)throw new Error('No se pudo obtener el informe.');
          // Keep the signed path and token unchanged; use only the public API origin configured for this client.
          const publicBase=new URL(sb.supabaseUrl);
          const signed=new URL(response.data.url,publicBase);
          if(!signed.pathname.startsWith('/storage/v1/object/sign/')){
            throw new Error('Ruta del informe semanal no autorizada.');
          }
          signed.protocol=publicBase.protocol;
          signed.host=publicBase.host;
          return {...response.data,url:signed.href};
        }

        case 'listWeeklyReports': {
          const boot=await appBootstrap();
          if(!boot.user.IsRoot&&!boot.roles.includes('ADMIN'))throw new Error('ADMIN requerido.');
          const response=await sb.functions.invoke('parking-notifications',{
            body:{action:'list-weekly-reports',community_id:boot.communityId}
          });
          if(response.error)throw response.error;
          if(response.data?.error)throw new Error(response.data.error);
          return {reports: response.data.reports || []};
        }

        case 'housingDetail': {
          const [detail, complianceRules] = await Promise.all([
            housingDetail(payload),
            settingsApi.getComplianceRules()
          ]);
          return { ...detail, complianceRules };
        }

        case 'vehicleHistory':
          return vehicleHistory(
            payload
          );

        case 'saveUser':
          return adminUsersApi
            .saveUser(
              payload
            );

        case 'adminGenerateTemporaryPassword':
          return adminUsersApi
            .adminGenerateTemporaryPassword(
              payload
            );

        case 'adminSendPasswordReset':
          return adminUsersApi
            .adminSendPasswordReset(
              payload
            );

        case 'closeUserSessions':
          return adminUsersApi
            .closeUserSessions(
              payload
            );

        case 'updateProfile':
          return profileApi
            .updateProfile(
              payload
            );

        case 'changePassword':
          return profileApi
            .changePassword(
              payload
            );

        case 'systemStatus':
          return systemApi
            .systemStatus(
              payload
            );

        case 'systemSetMaintenance':
          return systemApi
            .systemSetMaintenance(
              payload
            );

        case 'systemLegacyBridgeStatus':
          return systemApi
            .systemLegacyBridgeStatus(
              payload
            );

        case 'systemLegacyBridgeAction':
          return systemApi
            .systemLegacyBridgeAction(
              payload
            );

        case 'systemLegacyBridgeCommandStatus':
          return systemApi
            .systemLegacyBridgeCommandStatus(
              payload
            );

        case 'systemBackupStatus':
          return systemApi
            .systemBackupStatus(
              payload
            );

        case 'systemBackupRunNow':
          return systemApi
            .systemBackupRunNow(
              payload
            );

        case 'systemRoundTripPing':
          return systemApi
            .systemRoundTripPing(
              payload
            );

        case 'systemDiagnostics':
          return systemApi
            .systemDiagnostics(
              payload
            );

        case 'systemPerformanceHistory':
          return systemApi
            .systemPerformanceHistory(
              payload
            );

        case 'systemRecordClientPerformance':
          return systemApi
            .systemRecordClientPerformance(
              payload
            );

        case 'systemSheetsRealBenchmark':
          return systemApi
            .systemSheetsRealBenchmark(
              payload
            );

        case 'managerData':
          return adminDataApi
            .managerData(
              payload
            );

        default:
          throw new Error(
            `Acción Supabase no soportada: "${name}".`
          );
      }
    }

    async function finalSupabaseServer(
      fn,
      ...args
    ) {
      if (
        fn ===
        'loginWithPassword'
      ) {
        return authApi.login(
          args[0],
          args[1]
        );
      }

      if (
        fn ===
        'requestPasswordReset'
      ) {
        return authApi
          .requestPasswordReset(
            args[0]
          );
      }

      if (
        fn ===
        'completePasswordReset'
      ) {
        return authApi
          .completePasswordReset(
            args[0]
          );
      }

      if (fn === 'logout') {
        return authApi.logout();
      }

      if (
        fn ===
        'getPublicParkingSettings'
      ) {
        try {
          return (
            unwrap(
              await sb.rpc(
                'parking_public_settings'
              )
            ) ||
            window
              .INITIAL_PUBLIC_SETTINGS ||
            {}
          );
        } catch (_) {
          return (
            window
              .INITIAL_PUBLIC_SETTINGS ||
            {}
          );
        }
      }

      if (
        fn ===
        'getPublicAppState'
      ) {
        return publicAppState(
          true
        );
      }

      if (fn === 'api') {
        return action(
          args[1],
          args[2] || {}
        );
      }

      throw new Error(
        `Operación de backend no soportada: "${fn}".`
      );
    }

    return {
      action,
      server:
        finalSupabaseServer
    };
  }
