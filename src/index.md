---
title: Главная страница
layout: base.njk
---
# Home

Моя скромная библиотека с материалами об аниме и всяком.

## Последние обновления

<div class="recent-updates">{% for item in collections.recentUpdates %}{% set type = 'draft' if item.data.draft else ('review' if (item.url | startsWith('/reviews/')) else 'note') %}<a href="{{ pathPrefix }}{{ item.url }}" class="recent-update-item"><span class="recent-update-badge badge-{{ type }}">{% if type == 'draft' %}черновик{% elif type == 'review' %}обзор{% else %}заметка{% endif %}</span><span class="recent-update-title">{% if item.data.categoryLabel %}<span class="recent-update-folder">{{ item.data.categoryLabel }}</span><span class="recent-update-sep">|</span>{% endif %}{{ item.data.title }}</span><span class="recent-update-date">{{ item.data.upd_date | readableDate }}</span></a>{% endfor %}</div>
