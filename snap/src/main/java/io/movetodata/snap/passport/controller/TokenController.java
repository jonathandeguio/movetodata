package io.movetodata.snap.passport.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.movetodata.snap.config.AppProperties;
import io.movetodata.snap.passport.library.models.TokenLongLived;
import io.movetodata.snap.passport.library.models.User;
import io.movetodata.snap.passport.library.repository.TokenRepository;
import io.movetodata.snap.passport.library.service.GroupService;
import io.movetodata.snap.passport.library.service.UserService;
import io.movetodata.snap.passport.security.TokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;
import java.io.IOException;
import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.http.MediaType.APPLICATION_JSON_VALUE;

@RestController
@RequestMapping("/api/passport/token")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Passport", description = "Authentication service endpoints")
public class TokenController {

    @Autowired
    private TokenRepository tokenRepository;

    private final UserService userService;

    private final GroupService groupService;

    @Autowired
    private TokenProvider tokenProvider;

    private AppProperties appProperties;


    @Operation(summary = "Create Long Lived Token")
    @PostMapping("/CreateLongLived")
    public void longLivedToken(HttpServletRequest request,
                               HttpServletResponse response, Principal principal,
                               @Valid @RequestBody TokenLongLived tokenLongLived) throws IOException {

        String access_token = tokenProvider.createLongLivedToken(principal, tokenLongLived);

        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", access_token);

        response.setContentType(APPLICATION_JSON_VALUE);
        new ObjectMapper().writeValue(response.getOutputStream(), tokens);

    }

    @Operation(summary = "It provides list of all users tokens")
    @GetMapping("/GetLongLived")
    public ResponseEntity<List<TokenLongLived>> getMyLongLivedTokens(HttpServletRequest request,
                                                                     HttpServletResponse response,
                                                                     Principal principal) {

        User user = userService.getUser(principal.getName());

        return ResponseEntity.ok().body(tokenRepository.getByUserId(user.id));
    }

}