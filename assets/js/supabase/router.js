(() => {
  'use strict';

  window.ParkingSupabaseRouter =
    function ParkingSupabaseRouter({
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
                await listIncidents()
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

          case 'housingDetail':
            return housingDetail(
              payload
            );

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
    };
})();
