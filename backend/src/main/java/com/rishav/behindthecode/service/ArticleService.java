package com.rishav.behindthecode.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.rishav.behindthecode.entity.Article;
import com.rishav.behindthecode.repository.ArticleRepository;

@Service
public class ArticleService {

    private final ArticleRepository articleRepository;

    public ArticleService(ArticleRepository articleRepository) {
        this.articleRepository = articleRepository;
    }

    public List<Article> getAllArticles() {
        return articleRepository.findAll();
    }

    public Optional<Article> getArticleById(Long id) {
        return articleRepository.findById(id);
    }

    public Optional<Article> getArticleBySlug(String slug) {
        return articleRepository.findBySlug(slug);
    }

    public Article createArticle(Article article) {
        return articleRepository.save(article);
    }

    public Article updateArticle(Long id, Article updatedArticle) {
        return articleRepository.findById(id)
                .map(existingArticle -> {
                    existingArticle.setTitle(updatedArticle.getTitle());
                    existingArticle.setSlug(updatedArticle.getSlug());
                    existingArticle.setExcerpt(updatedArticle.getExcerpt());
                    existingArticle.setContent(updatedArticle.getContent());
                    existingArticle.setCategory(updatedArticle.getCategory());
                    existingArticle.setCoverImage(updatedArticle.getCoverImage());
                    existingArticle.setPublished(updatedArticle.isPublished());
                    existingArticle.setPublishedAt(updatedArticle.getPublishedAt());
                    existingArticle.setReadTimeMinutes(
                            updatedArticle.getReadTimeMinutes()
                    );

                    return articleRepository.save(existingArticle);
                })
                .orElseThrow(() ->
                        new RuntimeException(
                                "Article not found with id: " + id
                        )
                );
    }

    public void deleteArticle(Long id) {
        if (!articleRepository.existsById(id)) {
            throw new RuntimeException(
                    "Article not found with id: " + id
            );
        }

        articleRepository.deleteById(id);
    }
}