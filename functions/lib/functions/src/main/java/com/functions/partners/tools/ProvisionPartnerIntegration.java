package com.functions.partners.tools;

import java.io.PrintStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

import com.functions.partners.models.PartnerIntegration;
import com.functions.partners.services.PartnerIntegrationService;
import com.functions.utils.environment.Environment;
import com.google.api.gax.rpc.AlreadyExistsException;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;

public final class ProvisionPartnerIntegration {
    private static final String USAGE = """
            Usage: ./provisionPartnerIntegration.sh --environment <dev|prod>
              --partner <integration-id> --organiser <organiser-user-id>
              --origin <exact-origin> [--origin <another-origin>] [--apply]

            Defaults to a local preview. --apply creates a new PartnerIntegrations record
            using Application Default Credentials and displays the key once.
            Existing records are never overwritten. Save the key outside the repository.
            """;

    private ProvisionPartnerIntegration() {
    }

    public static void main(String[] args) {
        System.exit(run(args, System.getenv(), System.out, System.err));
    }

    static int run(String[] args, Map<String, String> environment, PrintStream out, PrintStream err) {
        if (args.length == 0 || Arrays.asList(args).contains("--help")) {
            out.print(USAGE);
            return 0;
        }
        Options options;
        String key;
        PartnerIntegration integration;
        try {
            options = parse(args);
            key = PartnerIntegrationService.generateKey(options.partner());
            integration = new PartnerIntegration(true, options.organiser(), options.origins(),
                    List.of(PartnerIntegrationService.digestKey(key)));
            for (String origin : integration.allowedOrigins()) {
                PartnerIntegrationService.validateOrigin(origin, options.environment());
            }
        } catch (IllegalArgumentException | IllegalStateException e) {
            err.println("Invalid arguments: " + e.getMessage());
            err.print(USAGE);
            return 2;
        }

        String project = options.environment().getProjectName();
        String path = "PartnerIntegrations/" + options.partner();
        out.println("Project: " + project);
        out.println("Document: " + path);
        out.println("Organiser: " + integration.organiserId());
        out.println("Allowed origins: " + String.join(", ", integration.allowedOrigins()));
        if (!options.apply()) {
            out.println("Preview only. Add --apply to create the record.");
            return 0;
        }
        if (environment.containsKey("FIRESTORE_EMULATOR_HOST")) {
            err.println("Unset FIRESTORE_EMULATOR_HOST before provisioning a deployed project.");
            return 2;
        }

        boolean created = false;
        try (Firestore firestore = FirestoreOptions.newBuilder().setProjectId(project).build().getService()) {
            firestore.document(path).create(Map.of(
                    "enabled", integration.enabled(),
                    "organiserId", integration.organiserId(),
                    "allowedOrigins", integration.allowedOrigins(),
                    "keyDigests", integration.keyDigests())).get(30, TimeUnit.SECONDS);
            created = true;
            out.println("Created. Save this key and give it to the partner:");
            out.println("KEY: " + key);
            return 0;
        } catch (Exception e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            if (created) {
                err.println("Record created, but the Firestore client could not close cleanly.");
                return 0;
            }
            if (e instanceof ExecutionException && e.getCause() instanceof AlreadyExistsException) {
                err.println("Integration already exists. Nothing was overwritten.");
            } else {
                err.println("Provisioning failed or the outcome is unknown. Check " + path + " in " + project
                        + " before retrying. Verify Application Default Credentials and Firestore access.");
            }
            return 1;
        }
    }

    private static Options parse(String[] args) {
        Map<String, String> values = new HashMap<>();
        List<String> origins = new ArrayList<>();
        Set<String> namedOptions = Set.of("--environment", "--partner", "--organiser", "--origin");
        boolean apply = false;
        for (int i = 0; i < args.length; i++) {
            String name = args[i];
            if (name.equals("--apply") && !apply) {
                apply = true;
                continue;
            }
            if (!namedOptions.contains(name) || i + 1 == args.length || args[i + 1].startsWith("--")) {
                throw new IllegalArgumentException("Unknown option or missing value");
            }
            String value = args[++i];
            if (name.equals("--origin")) {
                origins.add(value);
            } else if (values.putIfAbsent(name, value) != null) {
                throw new IllegalArgumentException("Duplicate option");
            }
        }
        Environment environment = switch (values.getOrDefault("--environment", "")) {
            case "dev" -> Environment.DEVELOPMENT;
            case "prod" -> Environment.PRODUCTION;
            default -> throw new IllegalArgumentException("--environment must be dev or prod");
        };
        return new Options(environment, values.get("--partner"), values.get("--organiser"), origins, apply);
    }

    private record Options(Environment environment, String partner, String organiser, List<String> origins,
            boolean apply) {
    }
}
