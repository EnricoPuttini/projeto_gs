package br.com.zelo.controller;

import br.com.zelo.config.ZeloProperties;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/config")
@Tag(name = "Config")
public class ConfigController {

    private final ZeloProperties props;

    public ConfigController(ZeloProperties props) {
        this.props = props;
    }

    @GetMapping
    @Operation(summary = "Informa ao frontend se o modo demo está ativo")
    public Map<String, Object> config() {
        return Map.of("demoMode", props.demoMode());
    }
}
