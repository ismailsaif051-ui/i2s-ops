import { Global, Module } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { ScopeService } from './scope.service';

@Global()
@Module({
  providers: [RbacService, ScopeService],
  exports: [RbacService, ScopeService],
})
export class RbacModule {}
