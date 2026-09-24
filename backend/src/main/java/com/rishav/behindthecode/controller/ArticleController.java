package com.rishav.behindthecode.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rishav.behindthecode.entity.Article;
import com.rishav.behindthecode.service.ArticleService;

@RestController
@RequestMapping("/api/articles")
@CrossOrigin(
        origins = {
                "http://localhost:5173",
                "http://localhost:5174",
                "https://blog.rishavkamal.com"
        }
)
public class ArticleController {

    private final ArticleService articleService;

    public ArticleController(ArticleService articleService) {
        this.articleService = articleService;
    }

    @GetMapping
    public ResponseEntity<List<Article>> getAllArticles() {
        return ResponseEntity.ok(articleService.getAllArticles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Article> getArticleById(@PathVariable Long id) {
        return articleService.getArticleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<Article> getArticleBySlug(
            @PathVariable String slug
    ) {
        return articleService.getArticleBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Article> createArticle(
            @RequestBody Article article
    ) {
        Article createdArticle = articleService.createArticle(article);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdArticle);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Article> updateArticle(
            @PathVariable Long id,
            @RequestBody Article article
    ) {
        try {
            Article updatedArticle =
                    articleService.updateArticle(id, article);

            return ResponseEntity.ok(updatedArticle);

        } catch (RuntimeException exception) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteArticle(
            @PathVariable Long id
    ) {
        try {
            articleService.deleteArticle(id);

            return ResponseEntity.noContent().build();

        } catch (RuntimeException exception) {
            return ResponseEntity.notFound().build();
        }
    }
}