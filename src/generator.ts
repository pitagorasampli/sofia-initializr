import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import ejs from 'ejs'

interface ProjectData {
  productName: string
  serviceNameSuffix: string
  framework: 'quarkus' | 'spring-boot'
  projectCode: string
  groupId: string
  javaVersion: '21' | '25'
  teamOwner: string
  optionalFeatures: string[]
  grpcMode: string[]
  restClientName: string
}

export interface TemplateContext {
  productName: string
  serviceNameSuffix: string
  serviceName: string
  artifactId: string
  framework: string
  projectCode: string
  groupId: string
  basePackage: string
  packagePath: string
  javaVersion: string
  jdkImage: string
  teamOwner: string
  isQuarkus: boolean
  isSpringBoot: boolean
  hasRedis: boolean
  hasMysql: boolean
  hasMongodb: boolean
  hasRestClients: boolean
  restClientName: string
  restClientNameCap: string
  hasSqs: boolean
  hasFeatureFlags: boolean
  hasGrpc: boolean
  hasSofiaProto: boolean
  hasGrpcServer: boolean
  hasGrpcClient: boolean
  optionalFeatures: string[]
}

function buildContext(data: ProjectData): TemplateContext {
  const serviceName = `${data.productName}-${data.serviceNameSuffix}`
  const basePackage = `${data.groupId}.${data.serviceNameSuffix.replace(/-/g, '')}`
  const rc = data.restClientName.trim().toLowerCase().replace(/[-_]+(.)/g, (_, c) => c.toUpperCase())

  return {
    ...data,
    serviceName,
    artifactId: serviceName,
    basePackage,
    packagePath: basePackage.replace(/\./g, '/'),
    jdkImage: data.javaVersion === '21' ? 'ubi9/openjdk-21:1.21' : 'ubi9/openjdk-25:1.25',
    isQuarkus: data.framework === 'quarkus',
    isSpringBoot: data.framework === 'spring-boot',
    hasRedis: data.optionalFeatures.includes('redis'),
    hasMysql: data.optionalFeatures.includes('mysql'),
    hasMongodb: data.optionalFeatures.includes('mongodb'),
    hasRestClients: data.optionalFeatures.includes('restClients'),
    restClientName: rc,
    restClientNameCap: rc ? rc.charAt(0).toUpperCase() + rc.slice(1) : '',
    hasSqs: data.optionalFeatures.includes('sqs'),
    hasFeatureFlags: data.optionalFeatures.includes('featureFlags'),
    hasGrpc: data.optionalFeatures.includes('grpc'),
    hasSofiaProto: data.optionalFeatures.includes('grpc'),
    hasGrpcServer: data.grpcMode.includes('server'),
    hasGrpcClient: data.grpcMode.includes('client'),
  }
}

// Template registry: maps template path -> output path
// Templates will be loaded from public/templates/ at runtime
async function loadTemplate(path: string): Promise<string> {
  const base = import.meta.env.BASE_URL || '/'
  const res = await fetch(`${base}templates/${path}`)
  if (!res.ok) throw new Error(`Template not found: ${path}`)
  return res.text()
}

async function renderTemplate(templatePath: string, ctx: TemplateContext): Promise<string> {
  const tpl = await loadTemplate(templatePath)
  return ejs.render(tpl, ctx)
}

function getFileManifest(ctx: TemplateContext): Array<{ template: string; output: string } | { literal: string; output: string }> {
  const fw = ctx.framework
  const javaBase = `src/main/java/${ctx.packagePath}`
  const testBase = `src/test/java/${ctx.packagePath}`

  const files: Array<{ template: string; output: string } | { literal: string; output: string }> = [
    // Root
    { template: 'shared/README.md.ejs', output: 'README.md' },
    { template: 'shared/editorconfig', output: '.editorconfig' },
    { template: 'shared/gitignore', output: '.gitignore' },
    { template: 'shared/dockerignore', output: '.dockerignore' },

    // Framework
    { template: `${fw}/pom.xml.ejs`, output: 'pom.xml' },
    { template: 'shared/docker/Dockerfile.jvm.ejs', output: 'src/main/docker/Dockerfile.jvm' },
    { template: `${fw}/application.yml.ejs`, output: 'src/main/resources/application.yml' },
    { template: `${fw}/application-dev.yml.ejs`, output: 'src/main/resources/application-dev.yml' },
    { template: `${fw}/application-hml.yml.ejs`, output: 'src/main/resources/application-hml.yml' },
    { template: `${fw}/application-stg.yml.ejs`, output: 'src/main/resources/application-stg.yml' },
    { template: `${fw}/application-prod.yml.ejs`, output: 'src/main/resources/application-prod.yml' },
    { template: `${fw}/application-test.yml.ejs`, output: 'src/test/resources/application-test.yml' },
    { template: 'shared/banner.txt.ejs', output: 'src/main/resources/banner.txt' },

    // Pipelines
    { template: 'shared/github/workflows/code-quality.yaml', output: '.github/workflows/code-quality.yaml' },
    { template: 'shared/github/workflows/deploy-nonprod.yaml', output: '.github/workflows/deploy-nonprod.yaml' },
    { template: 'shared/github/workflows/deploy-prod.yaml', output: '.github/workflows/deploy-prod.yaml' },
    { template: 'shared/github/workflows/pr-builder.yaml', output: '.github/workflows/pr-builder.yaml' },
    { template: 'shared/github/CODEOWNERS.ejs', output: '.github/CODEOWNERS' },
    { template: 'shared/github/dependabot.yml', output: '.github/dependabot.yml' },

    // Domain exceptions
    { template: 'shared/java/domain/exception/BaseException.java.ejs', output: `${javaBase}/domain/exception/BaseException.java` },
    { template: 'shared/java/domain/exception/BadRequestException.java.ejs', output: `${javaBase}/domain/exception/BadRequestException.java` },
    { template: 'shared/java/domain/exception/UnauthorizedException.java.ejs', output: `${javaBase}/domain/exception/UnauthorizedException.java` },
    { template: 'shared/java/domain/exception/ForbiddenException.java.ejs', output: `${javaBase}/domain/exception/ForbiddenException.java` },
    { template: 'shared/java/domain/exception/NotFoundException.java.ejs', output: `${javaBase}/domain/exception/NotFoundException.java` },
    { template: 'shared/java/domain/exception/ConflictException.java.ejs', output: `${javaBase}/domain/exception/ConflictException.java` },
    { template: 'shared/java/domain/exception/UnprocessableContentException.java.ejs', output: `${javaBase}/domain/exception/UnprocessableContentException.java` },
    { template: 'shared/java/domain/exception/InternalCode.java.ejs', output: `${javaBase}/domain/exception/InternalCode.java` },
    { template: 'shared/java/domain/exception/InternalCodeParser.java.ejs', output: `${javaBase}/domain/exception/InternalCodeParser.java` },
    { template: 'shared/java/domain/exception/InternalCodeNormalizer.java.ejs', output: `${javaBase}/domain/exception/InternalCodeNormalizer.java` },
    { template: 'shared/java/domain/exception/enums/InternalCodeEnum.java.ejs', output: `${javaBase}/domain/exception/enums/InternalCodeEnum.java` },
    { template: 'shared/java/domain/exception/enums/ExceptionTypeEnum.java.ejs', output: `${javaBase}/domain/exception/enums/ExceptionTypeEnum.java` },
    { template: 'shared/java/domain/port/output/ExceptionFactoryPort.java.ejs', output: `${javaBase}/domain/port/output/ExceptionFactoryPort.java` },
    { template: 'shared/java/domain/port/output/MessageResolverPort.java.ejs', output: `${javaBase}/domain/port/output/MessageResolverPort.java` },

    // Infrastructure exception
    { template: `${fw}/java/infrastructure/exception/ExceptionFactory.java.ejs`, output: `${javaBase}/infrastructure/exception/ExceptionFactory.java` },
    { template: `${fw}/java/infrastructure/exception/handler/ExceptionHandler.java.ejs`, output: `${javaBase}/infrastructure/exception/handler/${ctx.isQuarkus ? 'ExceptionHandler' : 'BaseExceptionHandler'}.java` },
    { template: `${fw}/java/infrastructure/exception/handler/GlobalExceptionHandler.java.ejs`, output: `${javaBase}/infrastructure/exception/handler/GlobalExceptionHandler.java` },
    { template: `${fw}/java/infrastructure/exception/handler/GelfLogMessage.java.ejs`, output: `${javaBase}/infrastructure/exception/handler/GelfLogMessage.java` },

    // Config
    { template: `${fw}/java/infrastructure/config/OpenApiConfig.java.ejs`, output: `${javaBase}/infrastructure/config/OpenApiConfig.java` },

    // i18n & context
    { template: `${fw}/java/infrastructure/i18n/ExceptionMessages.java.ejs`, output: `${javaBase}/infrastructure/i18n/ExceptionMessages.java` },
    { template: `${fw}/java/infrastructure/web/context/RequestContext.java.ejs`, output: `${javaBase}/infrastructure/web/context/RequestContext.java` },
    { template: 'shared/messages/exceptions_pt.properties.ejs', output: 'src/main/resources/messages/exceptions_pt.properties' },

    // Web filter
    ...(ctx.isQuarkus ? [
      { template: `${fw}/java/infrastructure/web/filter/Authenticated.java.ejs`, output: `${javaBase}/infrastructure/web/filter/Authenticated.java` },
      { template: `${fw}/java/infrastructure/web/filter/AuthenticationFilter.java.ejs`, output: `${javaBase}/infrastructure/web/filter/AuthenticationFilter.java` },
    ] : [
      { template: `${fw}/java/infrastructure/web/filter/SecurityConfig.java.ejs`, output: `${javaBase}/infrastructure/web/filter/SecurityConfig.java` },
      { template: `${fw}/java/infrastructure/web/filter/AuthenticationFilter.java.ejs`, output: `${javaBase}/infrastructure/web/filter/AuthenticationFilter.java` },
    ]),

    // Health checks
    { template: `${fw}/java/infrastructure/k8s/ReadinessCheck.java.ejs`, output: `${javaBase}/infrastructure/k8s/ReadinessCheck.java` },
    { template: `${fw}/java/infrastructure/k8s/LivenessCheck.java.ejs`, output: `${javaBase}/infrastructure/k8s/LivenessCheck.java` },

    // ArchUnit
    { template: 'shared/java/ArchitectureTest.java.ejs', output: `${testBase}/ArchitectureTest.java` },

    // Hooks
    { template: 'shared/hooks/pre-commit', output: '.hooks/pre-commit' },
    { template: 'shared/hooks/commit-msg', output: '.hooks/commit-msg' },
    { template: 'shared/hooks/setup-hooks.sh', output: '.hooks/setup-hooks.sh' },

    // Maven wrapper
    { template: 'shared/mvn/wrapper/maven-wrapper.properties', output: '.mvn/wrapper/maven-wrapper.properties' },
  ]

  // Gitkeep dirs
  const keepDirs = [
    'application/usecase',
    'domain/model',
    'domain/port/input',
    'domain/port/output',
    'infrastructure/adapters/input/rest',
    'infrastructure/adapters/output',
  ]
  if (ctx.hasGrpcServer) keepDirs.push('infrastructure/adapters/input/grpc')
  if (ctx.hasGrpcClient) keepDirs.push('infrastructure/adapters/output/grpc')
  for (const dir of keepDirs) {
    files.push({ literal: '', output: `${javaBase}/${dir}/.gitkeep` })
  }

  // Spring Boot main class
  if (ctx.isSpringBoot) {
    files.push({ template: 'spring-boot/java/Application.java.ejs', output: `${javaBase}/Application.java` })
    files.push({ template: `${fw}/java/infrastructure/logging/LoggingConfig.java.ejs`, output: `${javaBase}/infrastructure/logging/LoggingConfig.java` })
  }

  // Quarkus native dockerfile
  if (ctx.isQuarkus) {
    files.push({ template: 'shared/docker/Dockerfile.native', output: 'src/main/docker/Dockerfile.native' })
  }

  // WebClient config
  if (ctx.isSpringBoot && ctx.hasRestClients) {
    files.push({ template: `${fw}/java/infrastructure/config/WebClientConfig.java.ejs`, output: `${javaBase}/infrastructure/config/${ctx.restClientNameCap}WebClientConfig.java` })
  }

  // SQS
  if (ctx.hasSqs) {
    files.push({ template: 'shared/github/workflows/pr-terraform.yaml', output: '.github/workflows/pr-terraform.yaml' })
    files.push({ template: 'shared/github/workflows/terraform-apply.yml', output: '.github/workflows/terraform-apply.yml' })
    files.push({ template: `${fw}/java/infrastructure/messaging/QueueUrlBuilder.java.ejs`, output: `${javaBase}/infrastructure/adapters/input/messaging/QueueUrlBuilder.java` })
    if (ctx.isQuarkus) {
      files.push({ template: `${fw}/java/infrastructure/messaging/AwsSqsClient.java.ejs`, output: `${javaBase}/infrastructure/adapters/input/messaging/AwsSqsClient.java` })
      files.push({ template: `${fw}/java/infrastructure/messaging/SqsConsumerInitializer.java.ejs`, output: `${javaBase}/infrastructure/adapters/input/messaging/SqsConsumerInitializer.java` })
    }
    // Terraform
    files.push({ template: 'shared/terraform/main.tf.ejs', output: 'terraform/main.tf' })
    files.push({ template: 'shared/terraform/provider.tf', output: 'terraform/provider.tf' })
    files.push({ template: 'shared/terraform/variable.tf.ejs', output: 'terraform/variable.tf' })
    files.push({ template: 'shared/terraform/output.tf', output: 'terraform/output.tf' })
    files.push({ template: 'shared/terraform/sqs/sqs.tf', output: 'terraform/sqs/sqs.tf' })
    files.push({ template: 'shared/terraform/sqs/variables.tf', output: 'terraform/sqs/variables.tf' })
    files.push({ template: 'shared/terraform/sns/sns.tf', output: 'terraform/sns/sns.tf' })
    files.push({ template: 'shared/terraform/sns/variables.tf', output: 'terraform/sns/variables.tf' })
    files.push({ template: 'shared/terraform/subscription/subscription.tf', output: 'terraform/subscription/subscription.tf' })
    files.push({ template: 'shared/terraform/backend/nonprod.tfvars.ejs', output: 'terraform/backend/nonprod.tfvars' })
    files.push({ template: 'shared/terraform/backend/prod.tfvars.ejs', output: 'terraform/backend/prod.tfvars' })
    files.push({ template: 'shared/terraform/backend/qa.tfvars.ejs', output: 'terraform/backend/qa.tfvars' })
  }

  return files
}

export async function generateProject(data: ProjectData) {
  const ctx = buildContext(data)
  const manifest = getFileManifest(ctx)
  const zip = new JSZip()
  const root = zip.folder(ctx.serviceName)!

  const results = await Promise.allSettled(
    manifest.map(async (entry) => {
      if ('literal' in entry) {
        root.file(entry.output, entry.literal)
        return
      }
      const tplPath = entry.template
      let content: string
      if (tplPath.endsWith('.ejs')) {
        content = await renderTemplate(tplPath, ctx)
      } else {
        content = await loadTemplate(tplPath)
      }
      root.file(entry.output, content)
    })
  )

  const errors = results.filter(r => r.status === 'rejected')
  if (errors.length > 0) {
    console.warn(`${errors.length} templates failed:`, errors)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `${ctx.serviceName}.zip`)
}
