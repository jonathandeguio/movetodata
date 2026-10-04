package io.movetodata.snap;

import io.movetodata.snap.build.library.enums.BuildType;
import io.movetodata.snap.build.library.models.TriggerManagerModel;
import io.movetodata.snap.build.library.repository.TriggerRepository;
import io.movetodata.snap.passport.library.models.AuthProvider;
import io.movetodata.snap.passport.library.models.User;
import io.movetodata.snap.passport.library.models.UserPreferences;
import io.movetodata.snap.passport.library.repository.UserRepository;
import io.movetodata.snap.passport.library.service.UserService;
import io.movetodata.snap.platform.library.models.PlatformConfig;
import io.movetodata.snap.platform.library.models.SMTPConfigModel;
import io.movetodata.snap.platform.library.repository.PlatformConfigRepository;
import io.movetodata.snap.platform.library.repository.SMTPConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.*;

@SpringBootApplication
@RequiredArgsConstructor
public class InitializeData {

    // Inject the UserService and UserRepository dependencies
    private final UserService userService;
    private final UserRepository userRepository;
    private final PlatformConfigRepository platformConfigRepository;
    private final SMTPConfigRepository smtpConfigRepository;
    private final TriggerRepository triggerRepository;

    // Define a CommandLineRunner bean method
    @Bean
    CommandLineRunner initializeDataRunner() {
        return args -> {
            // Your initialization logic goes here
            if (!userRepository.existsByUsername("platform-administrator")) {
                userService.saveUser(new User(null, "Platform Administrator", "platform-administrator", "snap2024", "Platform", "Administrator", "None",
                        "",
                        "platform-administrator@movetodata.io", AuthProvider.local, null, null, false, null, new UserPreferences(), null, null, null, null, null, null));
            }

            if (!userRepository.existsByUsername("platform-internal")) {
                User platformInternal = userService.saveUser(new User(null, "Platform Internal", "platform-internal", "b071181ada05d564a60d", "Platform", "Internal", "None",
                        "",
                        "platform-internal@movetodata.io", AuthProvider.local, null, null, false, null, new UserPreferences(), null, null, null, null, null, null));
            }

            User platformAdministrator = userRepository.findByUsername("platform-administrator").orElseThrow(() ->
                    new UsernameNotFoundException("User not found with username : platform-administrator")
            );

            if (!platformConfigRepository.existsByName("platformConfig")) {
                platformConfigRepository.save(new PlatformConfig(null, new Date(), new Date(), null, null, "Snap", "platformConfig", null, "https://pypi.python.org/simple/", "http://username:pssword@proxy.example.com", false));
            }

            if (!smtpConfigRepository.existsByConfig("platform")) {
                smtpConfigRepository.save(new SMTPConfigModel("platform", "movetodata.mailer@gmail.com", "lvrbzwlbkivpnpkn", "smtp.gmail.com", 587, "true", "true"));
            }
            Optional<User> platformInternal = userRepository.findByUsername("platform-internal");
            String repoUrl = "https://github.com/MoveToData-io/";
            if (!triggerRepository.existsByName("boson-main")) {
                TriggerManagerModel bosonMain = new TriggerManagerModel(null, "boson-main", "boson build for main branch with Dockerfile", "main", "boson", repoUrl + "boson.git", null, null, BuildType.MANUAL, "Dockerfile", "movetodata", null, null, null, null, new Date(), null, platformInternal.get().getId(), null);
                triggerRepository.save(bosonMain);
            }
            if (!triggerRepository.existsByName("frontend-main")) {
                TriggerManagerModel frontendMain = new TriggerManagerModel(null, "frontend-main", "frontend build for main branch with Dockerfile", "main", "frontend", repoUrl + "frontend.git", null, null, BuildType.MANUAL, "Dockerfile", "movetodata", null, null, null, null, new Date(), null, platformInternal.get().getId(), null);
                triggerRepository.save(frontendMain);
            }
            if (!triggerRepository.existsByName("movetodata-docs-main")) {
                TriggerManagerModel movetodataDocsMain = new TriggerManagerModel(null, "movetodata-docs-main", "movetodata-docs build for main branch with Dockerfile", "main", "movetodata-docs", repoUrl + "movetodata-docs.git", null, null, BuildType.MANUAL, "Dockerfile", "movetodata", null, null, null, null, new Date(), null, platformInternal.get().getId(), null);
                triggerRepository.save(movetodataDocsMain);
            }

            if (!triggerRepository.existsByName("boson-lite")) {
                TriggerManagerModel bosonLite = new TriggerManagerModel(null, "boson-lite", "boson build for main branch with Dockerfile.liteViz", "main", "boson", repoUrl + "boson.git", null, null, BuildType.MANUAL, "Dockerfile.liteViz", "lite-viz", null, null, null, null, new Date(), null, platformInternal.get().getId(), null);
                triggerRepository.save(bosonLite);
            }
            if (!triggerRepository.existsByName("frontend-lite")) {
                TriggerManagerModel frontendLite = new TriggerManagerModel(null, "frontend-lite", "frontend build for main branch with Dockerfile", "main", "frontend", repoUrl + "frontend.git", null, null, BuildType.MANUAL, "Dockerfile", "lite-viz", null, null, null, null, new Date(), null, platformInternal.get().getId(), null);
                triggerRepository.save(frontendLite);
            }
            if (!triggerRepository.existsByName("movetodata-docs-lite")) {
                TriggerManagerModel movetodataDocsLite = new TriggerManagerModel(null, "movetodata-docs-lite", "MoveToData-Docs build for main branch with Dockerfile", "main", "movetodata-docs", repoUrl + "movetodata-docs.git", null, null, BuildType.MANUAL, "Dockerfile", "lite-viz", null, null, null, null, new Date(), null, platformInternal.get().getId(), null);
                triggerRepository.save(movetodataDocsLite);
            }

            if (!triggerRepository.existsByName("boson-feature")) {
                TriggerManagerModel bosonFeature = new TriggerManagerModel(null, "boson-feature", "boson build for feature branch with Dockerfile", "feature", "boson", repoUrl + "boson.git", null, null, BuildType.MANUAL, "Dockerfile", "movetodata-feature", null, null, null, null, new Date(), null, platformInternal.get().getId(), null);
                triggerRepository.save(bosonFeature);
            }
            if (!triggerRepository.existsByName("frontend-feature")) {
                TriggerManagerModel frontendFeature = new TriggerManagerModel(null, "frontend-feature", "frontend build for feature branch with Dockerfile", "feature", "frontend", repoUrl + "frontend.git", null, null, BuildType.MANUAL, "Dockerfile", "movetodata-feature", null, null, null, null, new Date(), null, platformInternal.get().getId(), null);
                triggerRepository.save(frontendFeature);
            }
            if (!triggerRepository.existsByName("movetodata-docs-feature")) {
                TriggerManagerModel movetodataDocsFeature = new TriggerManagerModel(null, "movetodata-docs-feature", "movetodata-docs build for feature branch with Dockerfile", "feature", "movetodata-docs", repoUrl + "movetodata-docs.git", null, null, BuildType.MANUAL, "Dockerfile", "movetodata-feature", null, null, null, null, new Date(), null, platformInternal.get().getId(), null);
                triggerRepository.save(movetodataDocsFeature);
            }
        };
    }
}
