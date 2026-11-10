package io.movetodata.snap.subscribe.controllers;

import io.movetodata.snap.passport.library.service.UserService;
import io.movetodata.snap.passport.security.TokenProvider;
import io.movetodata.snap.subscribe.library.models.RequestSubscriptionModel;
import io.movetodata.snap.subscribe.library.models.SubscriptionModel;
import io.movetodata.snap.subscribe.library.repository.SubscriptionRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import javax.mail.MessagingException;
import java.security.Principal;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@EnableWebMvc
@RestController
@RequestMapping("/api/subscribe")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Subscribe", description = "Subscription Management")
public class SubscriptionController {

    private final UserService userService;
    private final SubscriptionRepository subscriptionRepository;
//    private final MailService mailService;
    @Autowired
    private TokenProvider tokenProvider;

    @Operation(summary = "Create Subscription.")
    @PostMapping("/create")
    public ResponseEntity<Object> create(Principal principal, @RequestBody RequestSubscriptionModel subscription) {
        UUID userId = userService.getUser(principal.getName()).getId();


        SubscriptionModel newSubscriptionModel = new SubscriptionModel();

        // Subscription Details
        newSubscriptionModel.setName(subscription.getName());

        newSubscriptionModel.setJobId(subscription.getJobId());

        // Email Details
        newSubscriptionModel.setSendTo(subscription.getSendTo());
        newSubscriptionModel.setSubject(subscription.getSubject());
        newSubscriptionModel.setBody(subscription.getBody());

        // Schedule Details
        newSubscriptionModel.setCronExpression(subscription.getCronExpression());
        newSubscriptionModel.setStartTime(subscription.getStartTime());

        // Configuration
        newSubscriptionModel.setPaused(subscription.getPaused());
        newSubscriptionModel.setPreviewImage(subscription.getPreviewImage());
        newSubscriptionModel.setProvidePermission(subscription.getProvidePermission());

        // Resource
        newSubscriptionModel.setResourceType(subscription.getResourceType());
        newSubscriptionModel.setResourceId(subscription.getResourceId());
        newSubscriptionModel.setTabId(subscription.getTabId());

        // Creation
        newSubscriptionModel.setCreatedAt(new Date());
        newSubscriptionModel.setCreatedBy(userId);

        // Update
        newSubscriptionModel.setUpdatedAt(new Date());
        newSubscriptionModel.setUpdatedBy(userId);

        subscriptionRepository.save(newSubscriptionModel);

        return new ResponseEntity<>(newSubscriptionModel, HttpStatus.OK);
    }

    @Operation(summary = "Update Subscription.")
    @PostMapping("/update/{subscriptionId}")
    public ResponseEntity<Object> update(Principal principal, @PathVariable("subscriptionId") UUID subscriptionId, @RequestBody SubscriptionModel subscription) {
        UUID userId = userService.getUser(principal.getName()).getId();

//        System.out.println(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
//        System.out.println(subscription.getId());
//        System.out.println(subscription.getResourceId());
//        System.out.println(subscription.getName());
//        System.out.println(subscription.getSendTo());
//        System.out.println(subscription.getBody());
//        System.out.println(subscription.getCronExpression());
//        System.out.println(subscription.getStartTime());
//        System.out.println(subscription.getResourceType());
//        System.out.println(subscription.getPaused());
//        System.out.println(subscription.getPreviewImage());
//        System.out.println(subscription.getProvidePermission());
//
//        System.out.println(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");

        SubscriptionModel alreadyExitedSubscriptionModel = subscriptionRepository.getReferenceById(subscriptionId);

        // Subscription Details
        alreadyExitedSubscriptionModel.setName(subscription.getName());

        alreadyExitedSubscriptionModel.setJobId(subscription.getJobId());

        // Email Details
        alreadyExitedSubscriptionModel.setSendTo(subscription.getSendTo());
        alreadyExitedSubscriptionModel.setSubject(subscription.getSubject());
        alreadyExitedSubscriptionModel.setBody(subscription.getBody());

        // Schedule Details
        alreadyExitedSubscriptionModel.setCronExpression(subscription.getCronExpression());
        alreadyExitedSubscriptionModel.setStartTime(subscription.getStartTime());

        // Configuration
        alreadyExitedSubscriptionModel.setPaused(subscription.getPaused());
        alreadyExitedSubscriptionModel.setPreviewImage(subscription.getPreviewImage());
        alreadyExitedSubscriptionModel.setProvidePermission(subscription.getProvidePermission());

        // Resource
        alreadyExitedSubscriptionModel.setResourceType(subscription.getResourceType());
        alreadyExitedSubscriptionModel.setResourceId(subscription.getResourceId());
        alreadyExitedSubscriptionModel.setTabId(subscription.getTabId());

        // Update
        alreadyExitedSubscriptionModel.setUpdatedAt(new Date());
        alreadyExitedSubscriptionModel.setUpdatedBy(userId);

        subscriptionRepository.save(alreadyExitedSubscriptionModel);
//        System.out.println(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
//        System.out.println(alreadyExitedSubscriptionModel.getId());
//        System.out.println(alreadyExitedSubscriptionModel.getResourceId());
//        System.out.println(alreadyExitedSubscriptionModel.getName());
//        System.out.println(alreadyExitedSubscriptionModel.getSendTo());
//        System.out.println(alreadyExitedSubscriptionModel.getBody());
//        System.out.println(alreadyExitedSubscriptionModel.getCronExpression());
//        System.out.println(alreadyExitedSubscriptionModel.getStartTime());
//        System.out.println(alreadyExitedSubscriptionModel.getResourceType());
//        System.out.println(alreadyExitedSubscriptionModel.getPaused());
//        System.out.println(alreadyExitedSubscriptionModel.getPreviewImage());
//        System.out.println(alreadyExitedSubscriptionModel.getProvidePermission());
//        System.out.println(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
        return new ResponseEntity<>("Update Success", HttpStatus.OK);
    }

    @Operation(summary = "Get Subscription.")
    @GetMapping("/getSubscription/{resourceId}")
    public ResponseEntity<Object> get(Principal principal, @PathVariable("resourceId") UUID resourceId) {
        UUID userId = userService.getUser(principal.getName()).getId();
        List<SubscriptionModel> subscriptionModels = subscriptionRepository.getByResourceId(resourceId);
//        Collections.sort(subscriptionModels,
//                (SubscriptionModel o1, SubscriptionModel o2) -> {
//                    return o2.getCreatedAt().compareTo(o1.getCreatedAt());
//                }
//        );
        return new ResponseEntity<>(subscriptionModels, HttpStatus.OK);
    }

    @Operation(summary = "Delete Subscription.")
    @DeleteMapping("/deleteSubscription/{subscriptionId}")
    public ResponseEntity<Object> delete(Principal principal, @PathVariable("subscriptionId") UUID subscriptionId) {
        UUID userId = userService.getUser(principal.getName()).getId();

        // Delete the related scheduler jobs
        subscriptionRepository.deleteById(subscriptionId);

        return new ResponseEntity<>("Delete Success", HttpStatus.OK);
    }

    @Operation(summary = "Delete Subscription.")
    @GetMapping("/sendMail")
    public ResponseEntity<Object> sendMail(Principal principal) throws MessagingException {
        UUID userId = userService.getUser(principal.getName()).getId();

//        mailService.sendMail("dbhagesh6@gmail.com", "This is a test email", "wedewjdewdhweij dweidhiwedh wed diweuhdiwehdiuw  diwehdiuhweiduhewdi we dhwiedhiweuhdiweudhiu iduweh diuwe hdiwhediwe d",
//                "bhagesh", "https://dev.movetodata.io/");
        return new ResponseEntity<>("Delete Success", HttpStatus.OK);
    }

}

