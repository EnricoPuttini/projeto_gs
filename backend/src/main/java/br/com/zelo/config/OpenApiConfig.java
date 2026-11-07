package br.com.zelo.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI zeloOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Zelo API")
                .version("v1")
                .description("Assistente do cidadao: recupera consultas perdidas por falta e avisa antes do alagamento. "
                        + "Todos os dados sao simulados."));
    }
}
