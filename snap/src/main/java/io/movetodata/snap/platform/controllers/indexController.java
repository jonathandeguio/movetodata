package io.movetodata.snap.platform.controllers;


import io.movetodata.snap.kitab.library.models.SocketMessage;
import io.movetodata.snap.passport.library.service.UserService;
import io.movetodata.snap.passport.security.TokenProvider;
import io.movetodata.snap.passport.util.AuthUtils;
import io.movetodata.snap.platform.library.models.Versions;
import io.movetodata.snap.platform.library.services.PlatformConfigService;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.security.Principal;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequiredArgsConstructor
@RequestMapping("/")
@Tag(name = "Index", description = "This is a only for health checks stuff, never delete this. All hell will break loose.")
public class indexController {

    private final UserService userService;
    @Autowired
    SimpMessagingTemplate template;
    @Autowired
    private TokenProvider tokenProvider;
    @Autowired
    private PlatformConfigService platformConfigService;

    @Hidden
    @RequestMapping("/")
    public String indexRedirect() {
        return "<html><h2>OK</h2></html>";
    }

    @Hidden
    @PostMapping("/api/ping")
    public ResponseEntity<Object> ping(Principal principal, HttpServletRequest request, @RequestBody HashMap<String, String> pingRequest) {
        String jwt = AuthUtils.getJwtFromRequest(request);

        if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
            if (principal != null) {
                UUID userId = userService.getUser(principal.getName()).getId();
                String path = pingRequest.get("path");
                if (path != null) {
                    String regex = "\\b[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\\b";
                    Pattern pattern = Pattern.compile(regex);
                    Matcher matcher = pattern.matcher(path);
                    if (matcher.find()) {
                        String firstUUID = matcher.group();
                        SocketMessage textMessage = new SocketMessage();
                        textMessage.setMessage(userId.toString());
                        template.convertAndSend("/topic/" + firstUUID, textMessage);
                    }
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("versions", new Versions());
            if (System.getenv("LAST_UPDATED_ON") != null) {
                response.put("lastUpdatedOn", System.getenv("LAST_UPDATED_ON"));
            }
            Date ttl = AuthUtils.getTTLFromJwt(jwt);
            response.put("message", "pong");
            response.put("ttl", (ttl.getTime() - (new Date()).getTime()) / 1000);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } else {
            return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);
        }
    }


    // Not working yet
    @Hidden
    @RequestMapping("/swagger")
    public String swaggerRedirect() {
        return "redirect:/swagger-ui.html";
    }

//    @MessageMapping("/sendMessage")
//    public void receiveMessage(@Payload SocketMessage textMessage) {
//        // receive message from client
//
//        
//    }
//
//
//    @SendTo("/topic/message")
//    public SocketMessage broadcastMessage(@Payload SocketMessage textMessage) {
//        return textMessage;
//    }

}
