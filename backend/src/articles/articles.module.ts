import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { Article } from './entities/article.entity';
import { SaFamily } from '../sa/sa-family.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Article, SaFamily])],
  providers: [ArticlesService],
  controllers: [ArticlesController],
})
export class ArticlesModule {}
