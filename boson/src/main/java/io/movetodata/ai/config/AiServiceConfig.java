package io.movetodata.ai.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.client.RestTemplate;

import java.util.concurrent.Executor;

/**
 * Spring configuration for the AI module.
 *
 * Declares:
 *  - The RestTemplate used by AiProxyController for standard JSON proxying.
 *  - The ThreadPoolTaskExecutor used by the chat SSE endpoint to stream tokens
 *    from the Python service to the browser without blocking Tomcat threads.
 */
@Configuration
public class AiServiceConfig {

    @Bean(name = "aiRestTemplate")
    public RestTemplate aiRestTemplate() {
        return new RestTemplate();
    }

    /**
     * Executor for SSE streaming threads in the chat endpoint.
     *
     * Each SSE connection runs in its own thread, reading from the Python
     * service and forwarding chunks to the SseEmitter. The pool is bounded
     * to avoid resource exhaustion when many concurrent chat sessions are open.
     */
    @Bean(name = "aiChatExecutor")
    public Executor aiChatExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("ai-chat-sse-");
        executor.initialize();
        return executor;
    }
}
