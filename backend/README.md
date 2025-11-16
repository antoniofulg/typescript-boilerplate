<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Autenticação e `tokenVersion`

Este backend usa um campo `tokenVersion` na entidade `User` (ver `prisma/schema.prisma`) para controle de invalidação de tokens JWT.

- **Login (`AuthService.login`)**
  - Ao autenticar com sucesso, o backend incrementa `tokenVersion` do usuário (`Prisma.user.update` com `tokenVersion: { increment: 1 }`).
  - O payload do JWT inclui `userId`, `email`, `role`, `tenantId` e o `tokenVersion` atual do usuário.

- **Refresh de token (`AuthService.refreshToken`)**
  - Busca o usuário no banco e gera um novo JWT usando o `tokenVersion` atual armazenado no banco.
  - Se o `tokenVersion` foi incrementado em outro fluxo (por exemplo, logout), tokens antigos deixam de ser aceitos.

- **Logout (`AuthService.logout`)**
  - Apenas incrementa `tokenVersion` do usuário.
  - Qualquer token emitido com um `tokenVersion` anterior passa a ser considerado inválido.

- **Validação do JWT (`JwtStrategy.validate`)**
  - Lê o payload do token (`userId`, `tokenVersion`, etc.).
  - Carrega o usuário e compara `payload.tokenVersion` com `user.tokenVersion`:
    - Se forem diferentes, lança `UnauthorizedException` (token inválido ou revogado).
    - Se `tokenVersion` não estiver presente no payload (tokens antigos), a validação ignora essa checagem por compatibilidade retroativa.
  - Para usuários não SUPER_USER com `tenantId` definido, também valida se o `Tenant` está com status `ACTIVE`.

Em resumo: **sempre que um usuário fizer login ou logout, o `tokenVersion` é atualizado e todos os tokens antigos são automaticamente invalidados**.

## Operações com SUPER_USER e confirmação de senha

Operações sensíveis envolvendo o papel `SUPER_USER` exigem confirmação de senha:

- **Criação de SUPER_USER (`UsersService.create`)**
  - Quando `role === SUPER_USER`, o DTO de criação deve conter `passwordConfirmation`.
  - A senha de confirmação é comparada com a senha do SUPER_USER atual que está realizando a operação.
  - Se a confirmação for ausente ou inválida, é lançada uma exceção (`BadRequestException` ou `ForbiddenException`).
  - SUPER_USER sempre é criado sem `tenantId` (global).

- **Atualização de usuário para SUPER_USER (`UsersService.update` + `UsersController.update`)**
  - Se o usuário alvo já for SUPER_USER, ou se o `role` estiver sendo alterado para SUPER_USER, é obrigatório informar `passwordConfirmation`.
  - O `UsersController` garante essa regra antes de chamar o serviço e retorna `BadRequestException` se a confirmação não for enviada.
  - O `UsersService` valida a senha via `verifySuperUserPassword`; se inválida, lança `ForbiddenException`.
  - Ao promover para SUPER_USER, o `tenantId` do usuário é definido como `null`.

- **Exclusão de SUPER_USER (`UsersController.remove`)**
  - Antes de deletar, o controller verifica se o usuário alvo é SUPER_USER.
  - Se for, exige `passwordConfirmation` no corpo da requisição e chama `verifyPasswordForSuperUserOperation` no serviço.
  - Sem confirmação, é lançada `BadRequestException`; com senha incorreta, `ForbiddenException`.

Essas regras são cobertas pelos testes em `src/auth`, `src/users` e garantem que alterações críticas em usuários SUPER_USER sempre exijam autenticação explícita do super usuário responsável.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
