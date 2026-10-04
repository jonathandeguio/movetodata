package io.movetodata.snap.deployments.library.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.movetodata.snap.build.library.models.TriggerArtifactModel;
import io.movetodata.snap.build.library.models.TriggerManagerModel;
import io.movetodata.snap.build.library.repository.TriggerArtifactRepository;
import io.movetodata.snap.build.library.repository.TriggerRepository;
import io.movetodata.snap.deployments.library.Enums.ConfigurationState;
import io.movetodata.snap.deployments.library.Enums.DeploymentMethod;
import io.movetodata.snap.deployments.library.models.ConfigurationComponentsModel;
import io.movetodata.snap.deployments.library.models.DeploymentModel;
import io.movetodata.snap.deployments.library.repository.ConfigurationComponentsRepository;
import io.movetodata.snap.deployments.library.repository.DeploymentRepository;
import io.movetodata.snap.deployments.library.requests.DeploymentStateRequestModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DeploymentService {

    @Autowired
    private DeploymentRepository deploymentRepository;

    @Autowired
    private ConfigurationComponentsRepository configurationComponentsRepository;

    @Autowired
    private TriggerRepository triggerRepository;

    @Autowired
    private TriggerArtifactRepository triggerArtifactRepository;

    private ConfigurationComponentsModel createNewConfigurationComponent(DeploymentModel deployment, DeploymentStateRequestModel requestModel, ConfigurationState configurationState, String globalVersion) {
        return ConfigurationComponentsModel.builder()
                .frontend(requestModel.getFrontend())
                .boson(requestModel.getBoson())
                .parler(requestModel.getParler())
                .julia(requestModel.getJulia())
                .callisto(requestModel.getCallisto())
                .capture(requestModel.getCapture())
                .moveToDataDocs(requestModel.getMoveToDataDocs())
                .sparkHistoryServer(requestModel.getSparkHistoryServer())
                .state(configurationState)
                .deployedAt(new Date())
                .globalVersion(globalVersion)
                .deploymentModel(deployment)
                .branch(requestModel.getBranch())
                .build();
    }

    @Transactional
    public void updateDeploymentComponents(UUID deploymentId, DeploymentStateRequestModel requestModel, ConfigurationState configurationState) throws Exception {
        DeploymentModel deployment = deploymentRepository.findById(deploymentId)
                .orElseThrow(() -> new IllegalArgumentException("Deployment not found"));

        List<ConfigurationComponentsModel> configurationComponentsModels = deployment.getConfigurationComponentsModel();

        // Custom comparator to sort ConfigurationComponentsModel instances
        configurationComponentsModels.sort(Comparator
                .comparing((ConfigurationComponentsModel c) -> c.getState() == ConfigurationState.ACTIVE || c.getState() == ConfigurationState.TARGET ? 0 : 1)
                .thenComparing(ConfigurationComponentsModel::getDeployedAt));

        // Archive all active configuration components
        configurationComponentsModels.forEach(component -> {
            if (component.getState() == configurationState && Objects.equals(component.getBranch(), requestModel.getBranch())) {
                component.setState(ConfigurationState.ARCHIVED);
                configurationComponentsRepository.save(component);
            }
        });

        String latestGlobalVersion = getLatestGlobalVersion(requestModel, configurationState);

        ConfigurationComponentsModel newComponent = createNewConfigurationComponent(deployment, requestModel, configurationState, latestGlobalVersion);
        configurationComponentsRepository.save(newComponent);

        // Add the new component to the deployment's configuration components
        configurationComponentsModels.add(newComponent);
        deployment.setConfigurationComponentsModel(configurationComponentsModels);
        deploymentRepository.save(deployment);
    }

    @Transactional
    public void updateAutomaticDeployments(String componentName, String newTag, String branch) throws Exception {
        List<DeploymentModel> automaticDeployments = deploymentRepository.findAll().stream()
                .filter(deployment -> deployment.getDeploymentMethod() == DeploymentMethod.AUTOMATIC && Objects.equals(deployment.getBranch(), branch))
                .collect(Collectors.toList());

        for (DeploymentModel deployment : automaticDeployments) {
            List<ConfigurationComponentsModel> targetComponents = deployment.getConfigurationComponentsModel().stream()
                    .filter(component -> component.getState() == ConfigurationState.TARGET && Objects.equals(component.getBranch(), branch))
                    .collect(Collectors.toList());

            ConfigurationComponentsModel activeComponent = !targetComponents.isEmpty()
                    ? targetComponents.get(0)
                    : new ConfigurationComponentsModel();

            DeploymentStateRequestModel requestModel = new DeploymentStateRequestModel();
            requestModel.setFrontend(activeComponent.getFrontend());
            requestModel.setBoson(activeComponent.getBoson());
            requestModel.setParler(activeComponent.getParler());
            requestModel.setJulia(activeComponent.getJulia());
            requestModel.setCallisto(activeComponent.getCallisto());
            requestModel.setCapture(activeComponent.getCapture());
            requestModel.setMoveToDataDocs(activeComponent.getMoveToDataDocs());
            requestModel.setSparkHistoryServer(activeComponent.getSparkHistoryServer());
            requestModel.setBranch(activeComponent.getBranch());

            switch (componentName.toLowerCase()) {
                case "frontend":
                    requestModel.setFrontend(newTag);
                    break;
                case "boson":
                    requestModel.setBoson(newTag);
                    break;
                case "parler":
                    requestModel.setParler(newTag);
                    break;
                case "julia":
                    requestModel.setJulia(newTag);
                    break;
                case "callisto":
                    requestModel.setCallisto(newTag);
                case "capture":
                    requestModel.setCapture(newTag);
                    break;
                case "movetodata-docs":
                    requestModel.setMoveToDataDocs(newTag);
                    break;
                case "spark-history-server":
                    requestModel.setSparkHistoryServer(newTag);
                    break;
                default:
                    throw new IllegalArgumentException("Invalid component name: " + componentName);
            }

            if (isTagAvailable(componentName + "-" + branch, newTag, branch)) {
                boolean process = processInTimeWindow(deployment.getId(), requestModel, ConfigurationState.TARGET);
            } else {
                System.out.println("Tag not available for component " + componentName + ": " + newTag);
            }
        }
    }

    //    private String getLatestGlobalVersion(DeploymentStateRequestModel deploymentStateRequestModel, ConfigurationState configurationState) throws Exception {
//        // TODO: Check if Last Updated Target Version is Available as Active then only increment global version or else updated the same Global Version.
//        // Step:
//        // Collect the LastTarget Version and LastGlobalVersion
//        // Check if GlobalVersion of Both are same. If same then Increment Or else Update Existing Target Version
//        List<ConfigurationState> states = Arrays.asList(ConfigurationState.ACTIVE, ConfigurationState.TARGET);
//        List<ConfigurationComponentsModel> allConfigurations = configurationComponentsRepository.findAllByStateInAndBranch(states, deploymentStateRequestModel.getBranch());
//        List<String> listOfGlobalVersion = new ArrayList<>();
//        for (ConfigurationComponentsModel c : allConfigurations) {
//            listOfGlobalVersion.add(c.getGlobalVersion());
//        }
//        if (listOfGlobalVersion.isEmpty()) {
//            return "0.0.1";
//        }
//        String globalVersion = "";
//        String highestGlobalVersion = findHighestVersion(listOfGlobalVersion);
//        if (configurationState == ConfigurationState.TARGET) {
//            List<ConfigurationComponentsModel> activeModels = configurationComponentsRepository.findByStateAndFrontendAndBosonAndParlerAndJuliaAndCallistoAndCaptureAndMoveToDataDocsAndSparkHistoryServerAndBranch(
//                    ConfigurationState.ACTIVE,
//                    deploymentStateRequestModel.getFrontend(),
//                    deploymentStateRequestModel.getBoson(),
//                    "0.0.21",
//                    deploymentStateRequestModel.getJulia(),
//                    deploymentStateRequestModel.getCallisto(),
//                    deploymentStateRequestModel.getCapture(),
//                    deploymentStateRequestModel.getMoveToDataDocs(),
//                    deploymentStateRequestModel.getSparkHistoryServer(),
//                    deploymentStateRequestModel.getBranch()
//            );
//            if (!activeModels.isEmpty()) {
//                globalVersion = findHighestVersion(activeModels.stream().map(ConfigurationComponentsModel::getGlobalVersion).collect(Collectors.toList()));
//            } else {
//                List<ConfigurationComponentsModel> targetModels = configurationComponentsRepository.findByStateAndFrontendAndBosonAndParlerAndJuliaAndCallistoAndCaptureAndMoveToDataDocsAndSparkHistoryServerAndBranch(
//                        ConfigurationState.TARGET,
//                        deploymentStateRequestModel.getFrontend(),
//                        deploymentStateRequestModel.getBoson(),
//                        deploymentStateRequestModel.getParler(),
//                        deploymentStateRequestModel.getJulia(),
//                        deploymentStateRequestModel.getCallisto(),
//                        deploymentStateRequestModel.getCapture(),
//                        deploymentStateRequestModel.getMoveToDataDocs(),
//                        deploymentStateRequestModel.getSparkHistoryServer(),
//                        deploymentStateRequestModel.getBranch()
//                );
//                if (!targetModels.isEmpty()) {
//                    globalVersion = findHighestVersion(targetModels.stream().map(ConfigurationComponentsModel::getGlobalVersion).collect(Collectors.toList()));
//                } else {
//                    globalVersion = incrementTag(highestGlobalVersion);
//                }
//            }
//
//        }
//        if (configurationState == ConfigurationState.ACTIVE) {
//            List<ConfigurationComponentsModel> targetModels = configurationComponentsRepository.findByStateAndFrontendAndBosonAndParlerAndJuliaAndCallistoAndCaptureAndMoveToDataDocsAndSparkHistoryServerAndBranch(
//                    ConfigurationState.TARGET,
//                    deploymentStateRequestModel.getFrontend(),
//                    deploymentStateRequestModel.getBoson(),
//                    null,
//                    deploymentStateRequestModel.getJulia(),
//                    deploymentStateRequestModel.getCallisto(),
//                    deploymentStateRequestModel.getCapture(),
//                    deploymentStateRequestModel.getMoveToDataDocs(),
//                    deploymentStateRequestModel.getSparkHistoryServer(),
//                    deploymentStateRequestModel.getBranch()
//            );
//            if (!targetModels.isEmpty()) {
////              If Found, then return the globalVersion
//                globalVersion = findHighestVersion(targetModels.stream().map(ConfigurationComponentsModel::getGlobalVersion).collect(Collectors.toList()));
//            } else {
//                List<ConfigurationComponentsModel> activeModels = configurationComponentsRepository.findByStateAndFrontendAndBosonAndParlerAndJuliaAndCallistoAndCaptureAndMoveToDataDocsAndSparkHistoryServerAndBranch(
//                        ConfigurationState.ACTIVE,
//                        deploymentStateRequestModel.getFrontend(),
//                        deploymentStateRequestModel.getBoson(),
//                        "0.0.21",
//                        deploymentStateRequestModel.getJulia(),
//                        deploymentStateRequestModel.getCallisto(),
//                        deploymentStateRequestModel.getCapture(),
//                        deploymentStateRequestModel.getMoveToDataDocs(),
//                        deploymentStateRequestModel.getSparkHistoryServer(),
//                        deploymentStateRequestModel.getBranch()
//                );
//                if (!activeModels.isEmpty()) {
//                    globalVersion = findHighestVersion(activeModels.stream().map(ConfigurationComponentsModel::getGlobalVersion).collect(Collectors.toList()));
//                } else {
//                    globalVersion = "0.0.1";
//                }
//            }
//        }
//
//        return globalVersion;
//    }
    private String getLatestGlobalVersion(DeploymentStateRequestModel deploymentStateRequestModel, ConfigurationState configurationState) throws Exception {
        // Collect target and active configuration states.
        List<ConfigurationState> states = Arrays.asList(ConfigurationState.ACTIVE, ConfigurationState.TARGET);
        List<ConfigurationComponentsModel> allConfigurations = configurationComponentsRepository.findAllByStateInAndBranch(states, deploymentStateRequestModel.getBranch());

        // Extract global versions from configurations.
        List<String> listOfGlobalVersion = allConfigurations.stream()
                .map(ConfigurationComponentsModel::getGlobalVersion)
                .collect(Collectors.toList());
        if (listOfGlobalVersion.isEmpty()) {
            return "0.0.1";
        }

        String highestGlobalVersion = findHighestVersion(listOfGlobalVersion);
        String globalVersion = "";

        if (configurationState == ConfigurationState.TARGET) {
            globalVersion = getTargetOrIncrementedVersion(deploymentStateRequestModel, highestGlobalVersion);
        } else if (configurationState == ConfigurationState.ACTIVE) {
            globalVersion = getActiveOrInitialVersion(deploymentStateRequestModel);
        }

        return globalVersion;
    }

    private String getActiveOrInitialVersion(DeploymentStateRequestModel deploymentStateRequestModel) throws Exception {
        List<ConfigurationComponentsModel> targetModels = configurationComponentsRepository.findByStateAndFrontendAndBosonAndParlerAndJuliaAndCallistoAndCaptureAndMoveToDataDocsAndSparkHistoryServerAndBranch(
                ConfigurationState.TARGET,
                deploymentStateRequestModel.getFrontend(),
                deploymentStateRequestModel.getBoson(),
                null,
                deploymentStateRequestModel.getJulia(),
                deploymentStateRequestModel.getCallisto(),
                deploymentStateRequestModel.getCapture(),
                deploymentStateRequestModel.getMoveToDataDocs(),
                deploymentStateRequestModel.getSparkHistoryServer(),
                deploymentStateRequestModel.getBranch()
        );

        if (!targetModels.isEmpty()) {
            return findHighestVersion(targetModels.stream().map(ConfigurationComponentsModel::getGlobalVersion).collect(Collectors.toList()));
        }

        List<ConfigurationComponentsModel> activeModels = configurationComponentsRepository.findByStateAndFrontendAndBosonAndParlerAndJuliaAndCallistoAndCaptureAndMoveToDataDocsAndSparkHistoryServerAndBranch(
                ConfigurationState.ACTIVE,
                deploymentStateRequestModel.getFrontend(),
                deploymentStateRequestModel.getBoson(),
                "0.0.21",
                deploymentStateRequestModel.getJulia(),
                deploymentStateRequestModel.getCallisto(),
                deploymentStateRequestModel.getCapture(),
                deploymentStateRequestModel.getMoveToDataDocs(),
                deploymentStateRequestModel.getSparkHistoryServer(),
                deploymentStateRequestModel.getBranch()
        );

        if (!activeModels.isEmpty()) {
            return findHighestVersion(activeModels.stream().map(ConfigurationComponentsModel::getGlobalVersion).collect(Collectors.toList()));
        }

        return "0.0.1";
    }

    private String getTargetOrIncrementedVersion(DeploymentStateRequestModel deploymentStateRequestModel, String highestGlobalVersion) throws Exception {
        // Retrieve the latest ACTIVE and TARGET versions
        List<ConfigurationComponentsModel> activeModels = configurationComponentsRepository.findByStateAndFrontendAndBosonAndParlerAndJuliaAndCallistoAndCaptureAndMoveToDataDocsAndSparkHistoryServerAndBranch(
                ConfigurationState.ACTIVE,
                deploymentStateRequestModel.getFrontend(),
                deploymentStateRequestModel.getBoson(),
                "0.0.21",
                deploymentStateRequestModel.getJulia(),
                deploymentStateRequestModel.getCallisto(),
                deploymentStateRequestModel.getCapture(),
                deploymentStateRequestModel.getMoveToDataDocs(),
                deploymentStateRequestModel.getSparkHistoryServer(),
                deploymentStateRequestModel.getBranch()
        );

        String latestActiveVersion = activeModels.isEmpty() ? null : findHighestVersion(activeModels.stream()
                .map(ConfigurationComponentsModel::getGlobalVersion)
                .collect(Collectors.toList()));

        List<ConfigurationComponentsModel> targetModels = configurationComponentsRepository.findByStateAndFrontendAndBosonAndParlerAndJuliaAndCallistoAndCaptureAndMoveToDataDocsAndSparkHistoryServerAndBranch(
                ConfigurationState.TARGET,
                deploymentStateRequestModel.getFrontend(),
                deploymentStateRequestModel.getBoson(),
                deploymentStateRequestModel.getParler(),
                deploymentStateRequestModel.getJulia(),
                deploymentStateRequestModel.getCallisto(),
                deploymentStateRequestModel.getCapture(),
                deploymentStateRequestModel.getMoveToDataDocs(),
                deploymentStateRequestModel.getSparkHistoryServer(),
                deploymentStateRequestModel.getBranch()
        );

        String latestTargetVersion = targetModels.isEmpty() ? null : findHighestVersion(targetModels.stream()
                .map(ConfigurationComponentsModel::getGlobalVersion)
                .collect(Collectors.toList()));

        // Check if the latest target version is the same as the active version.
        if (latestTargetVersion != null && latestTargetVersion.equals(latestActiveVersion)) {
            return incrementTag(highestGlobalVersion); // Increment if the target version is active
        }

        return latestTargetVersion != null ? latestTargetVersion : incrementTag(highestGlobalVersion);
    }

    private int compareVersions(String version1, String version2) {
        String[] v1Parts = version1.split("\\.");
        String[] v2Parts = version2.split("\\.");

        int major1 = Integer.parseInt(v1Parts[0]);
        int minor1 = Integer.parseInt(v1Parts[1]);
        int patch1 = Integer.parseInt(v1Parts[2]);

        int major2 = Integer.parseInt(v2Parts[0]);
        int minor2 = Integer.parseInt(v2Parts[1]);
        int patch2 = Integer.parseInt(v2Parts[2]);

        if (major1 != major2) {
            return Integer.compare(major1, major2);
        } else if (minor1 != minor2) {
            return Integer.compare(minor1, minor2);
        } else {
            return Integer.compare(patch1, patch2);
        }
    }

    public String findHighestVersion(List<String> versionList) throws Exception {
        if (versionList == null || versionList.isEmpty()) {
            throw new Exception("The version list cannot be null or empty.");
        }

        String highestVersion = versionList.get(0);

        for (String version : versionList) {
            if (compareVersions(version, highestVersion) > 0) {
                highestVersion = version;
            }
        }

        return highestVersion;
    }

    private String incrementTag(String latestTagName) {
        String newTagName;

        // Increment the latest tag or set it to 0.0.1 if no tags found
        String[] parts = latestTagName.split("/");
        String[] versionParts = parts[parts.length - 1].split("\\.");

        int majorNum = Integer.parseInt(versionParts[0]);
        int minorNum = Integer.parseInt(versionParts[1]);
        int patchNum = Integer.parseInt(versionParts[2]);

        if (patchNum < 99) {
            patchNum++;
        } else {
            patchNum = 0;
            if (minorNum < 99) {
                minorNum++;
            } else {
                minorNum = 0;
                majorNum++;
            }
        }

        newTagName = String.format("%d.%d.%d", majorNum, minorNum, patchNum);
        return newTagName;
    }

    private boolean isTagAvailable(String triggerName, String tag, String branch) {
        TriggerManagerModel triggerManager = triggerRepository.findByNameAndBranch(triggerName, branch)
                .orElseThrow(() -> new IllegalArgumentException("Trigger not found"));

        List<TriggerArtifactModel> artifacts = triggerArtifactRepository.findByTriggerManagerModelId(triggerManager.getId());
        return artifacts.stream().anyMatch(artifact -> tag.equals(artifact.getTag()));
    }

    public LocalTime processTime(long millisecondsSinceMidnight) {
        // Convert milliseconds since midnight to LocalTime
        long totalSeconds = millisecondsSinceMidnight / 1000;
        int hours = (int) (totalSeconds / 3600);
        int minutes = (int) ((totalSeconds % 3600) / 60);
        int seconds = (int) (totalSeconds % 60);

        return LocalTime.of(hours, minutes, seconds);
    }

    public boolean processInTimeWindow(UUID deploymentId, DeploymentStateRequestModel deploymentStateRequestModel, ConfigurationState state) throws Exception {
        DeploymentModel deployment = deploymentRepository.findById(deploymentId)
                .orElseThrow(() -> new IllegalArgumentException("Deployment not found"));
        deploymentStateRequestModel.setBranch(deployment.getBranch());

        // Convert start and end times from milliseconds since midnight using the system's time zone
        if (deployment.getOverRideTimeWindow() != null) {
            LocalTime overRide = processTime(deployment.getOverRideTimeWindow());
            handleOverride(overRide, deploymentStateRequestModel, deploymentId, state);

        }

        LocalTime timeWindowStart = deployment.getTimeWindowStart() != null
                ? processTime(deployment.getTimeWindowStart())
                : null;

        LocalTime timeWindowEnd = deployment.getTimeWindowEnd() != null
                ? processTime(deployment.getTimeWindowEnd())
                : null;


        boolean haveTimeWindow = (timeWindowStart != null && timeWindowEnd != null);
        if (!haveTimeWindow) {
            updateDeploymentComponents(deployment.getId(), deploymentStateRequestModel, state);
            return false; // Added return false to avoid processing if no time window
        }

        // Use the 'Europe/London' time zone, which corresponds to BST during daylight saving time
        ZonedDateTime zoneNow = ZonedDateTime.now(ZoneId.of("Europe/London"));
        LocalTime now = zoneNow.toLocalTime();

        boolean isEndTimeBeforeStartTime = haveTimeWindow && timeWindowEnd.isBefore(timeWindowStart);

        boolean process;
        if (!isEndTimeBeforeStartTime) {
            // Time window does not span midnight
            boolean withinTimeWindow = now.isAfter(timeWindowStart) && now.isBefore(timeWindowEnd);
            process = processTimeWindowAfterBefore(deployment, withinTimeWindow, deploymentStateRequestModel, state);
        } else {
            // Time window spans midnight
            process = processTimeWindowBeforeAfter(timeWindowStart, timeWindowEnd, deployment, deploymentStateRequestModel, state);
        }
        return process;
    }

    public void handleOverride(LocalTime overRideTime, DeploymentStateRequestModel deploymentStateRequestModel, UUID deploymentId, ConfigurationState state) throws Exception {
        ZonedDateTime zoneNow = ZonedDateTime.now(ZoneId.of("Europe/London"));
        LocalTime now = zoneNow.toLocalTime();

        if (now.isBefore(overRideTime)) {
            updateDeploymentComponents(deploymentId, deploymentStateRequestModel, state);
        }
    }

    public boolean processTimeWindowBeforeAfter(LocalTime timeWindowStart, LocalTime timeWindowEnd, DeploymentModel deployment, DeploymentStateRequestModel deploymentStateRequestModel, ConfigurationState state) throws Exception {
        LocalDate today = LocalDate.now();
        LocalDateTime newStartTime = LocalDateTime.of(today, timeWindowStart);

        LocalDate tomorrow = today.plusDays(1);
        LocalDateTime newEndTime = LocalDateTime.of(tomorrow, timeWindowEnd);

        LocalDateTime now = LocalDateTime.now();
        boolean isInTimeRange = now.isAfter(newStartTime) && now.isBefore(newEndTime);

        return processTimeWindowAfterBefore(deployment, isInTimeRange, deploymentStateRequestModel, state);
    }

    public boolean processTimeWindowAfterBefore(DeploymentModel deployment, Boolean withinTimeWindow, DeploymentStateRequestModel deploymentStateRequestModel, ConfigurationState state) throws Exception {
        if (deployment.getDeploymentMethod() == DeploymentMethod.AUTOMATIC
                && deployment.getPausedUntil() != null
                && deployment.getPausedUntil().toInstant().isBefore(Instant.now())
                && !withinTimeWindow) {
            return false;
        } else if (withinTimeWindow) {
            updateDeploymentComponents(deployment.getId(), deploymentStateRequestModel, state);
            return true;
        } else {
            return false;
        }
    }

}