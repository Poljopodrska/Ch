"""
Translation Service for Ch Project
Provides LLM-powered translations using OpenAI GPT-3.5-turbo
Supports multiple languages with caching for performance
"""

import os
import json
import asyncio
from typing import Dict, List, Optional
from datetime import datetime
import openai
import psycopg2
from psycopg2.extras import RealDictCursor

# OpenAI Configuration
openai.api_key = os.getenv('OPENAI_API_KEY', '')  # Will use AVA credentials

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'ch-production-db.cifgmm0mqg5q.us-east-1.rds.amazonaws.com'),
    'port': int(os.getenv('DB_PORT', '5432')),
    'database': os.getenv('DB_NAME', 'ch_production'),
    'user': os.getenv('DB_USER', 'ch_admin'),
    'password': os.getenv('DB_PASSWORD', 'LLJW8cLuLv1yyJlRt6aUioSzq')
}

# Supported languages
SUPPORTED_LANGUAGES = {
    'en': 'English',
    'sl': 'Slovenian',
    'de': 'German',
    'it': 'Italian',
    'hr': 'Croatian',
    'sr': 'Serbian',
    'hu': 'Hungarian'
}

class TranslationService:
    """LLM-powered translation service with caching"""
    
    def __init__(self):
        self.cache = {}
        self.db_conn = None
        
    def _get_db_connection(self):
        """Get database connection"""
        if not self.db_conn or self.db_conn.closed:
            self.db_conn = psycopg2.connect(**DB_CONFIG)
        return self.db_conn
    
    def _get_translation_prompt(self, text: str, target_language: str, context: str = None) -> str:
        """Generate translation prompt for OpenAI"""
        language_name = SUPPORTED_LANGUAGES.get(target_language, target_language)
        
        prompt = f"""Translate the following text from English to {language_name}.
Context: {context or 'User interface text'}
Maintain any technical terms, formatting, and placeholders.
Text: "{text}"
Respond with only the translation, no explanations."""
        
        return prompt
    
    async def translate_text(self, text: str, target_language: str, context: str = None) -> str:
        """Translate text to target language using OpenAI"""
        if target_language == 'en':
            return text  # No translation needed
            
        # Check cache first
        cache_key = f"{text}:{target_language}:{context}"
        cached = self._get_cached_translation(text, target_language, context)
        if cached:
            return cached
        
        try:
            # Call OpenAI API
            prompt = self._get_translation_prompt(text, target_language, context)
            
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a professional translator."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,  # Low temperature for consistent translations
                max_tokens=1000
            )
            
            translated_text = response.choices[0].message.content.strip()
            
            # Cache the translation
            self._cache_translation(text, target_language, translated_text, context)
            
            return translated_text
            
        except Exception as e:
            print(f"Translation error: {str(e)}")
            return text  # Fallback to original text
    
    def translate_text_sync(self, text: str, target_language: str, context: str = None) -> str:
        """Synchronous wrapper for translate_text"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(self.translate_text(text, target_language, context))
        finally:
            loop.close()
    
    async def translate_batch(self, texts: List[str], target_language: str, context: str = None) -> List[str]:
        """Translate multiple texts efficiently"""
        if target_language == 'en':
            return texts
        
        # Separate cached and uncached texts
        translations = {}
        texts_to_translate = []
        
        for text in texts:
            cached = self._get_cached_translation(text, target_language, context)
            if cached:
                translations[text] = cached
            else:
                texts_to_translate.append(text)
        
        # Translate uncached texts
        if texts_to_translate:
            tasks = [self.translate_text(text, target_language, context) for text in texts_to_translate]
            results = await asyncio.gather(*tasks)
            
            for text, translation in zip(texts_to_translate, results):
                translations[text] = translation
        
        # Return in original order
        return [translations[text] for text in texts]
    
    def _get_cached_translation(self, source_text: str, target_language: str, context: str = None) -> Optional[str]:
        """Get translation from cache/database"""
        try:
            conn = self._get_db_connection()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute("""
                SELECT translated_text 
                FROM translations 
                WHERE source_text = %s 
                AND target_language = %s 
                AND (context = %s OR (context IS NULL AND %s IS NULL))
            """, (source_text, target_language, context, context))
            
            result = cur.fetchone()
            cur.close()
            
            return result['translated_text'] if result else None
            
        except Exception as e:
            print(f"Cache lookup error: {str(e)}")
            return None
    
    def _cache_translation(self, source_text: str, target_language: str, translated_text: str, context: str = None):
        """Save translation to cache/database"""
        try:
            conn = self._get_db_connection()
            cur = conn.cursor()
            
            cur.execute("""
                INSERT INTO translations (source_text, target_language, translated_text, context)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (source_text, target_language, context) 
                DO UPDATE SET translated_text = EXCLUDED.translated_text, updated_at = NOW()
            """, (source_text, target_language, translated_text, context))
            
            conn.commit()
            cur.close()
            
        except Exception as e:
            print(f"Cache save error: {str(e)}")
    
    def get_ui_translations(self, language: str) -> Dict[str, str]:
        """Get all UI translations for a language"""
        if language == 'en':
            return {}  # English is the default
        
        try:
            conn = self._get_db_connection()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute("""
                SELECT source_text, translated_text
                FROM translations
                WHERE target_language = %s
                AND context IN ('UI', 'UI_LABEL', 'UI_BUTTON', 'UI_MESSAGE')
            """, (language,))
            
            results = cur.fetchall()
            cur.close()
            
            return {row['source_text']: row['translated_text'] for row in results}
            
        except Exception as e:
            print(f"UI translations error: {str(e)}")
            return {}
    
    def preload_common_translations(self, language: str):
        """Preload common UI translations"""
        common_terms = [
            # Navigation
            ("Dashboard", "UI_LABEL"),
            ("Production Planning", "UI_LABEL"),
            ("Recipes", "UI_LABEL"),
            ("Production Costs", "UI_LABEL"),
            ("Production Plans", "UI_LABEL"),
            ("Surplus Inventory", "UI_LABEL"),
            ("Analysis", "UI_LABEL"),
            
            # Actions
            ("Save", "UI_BUTTON"),
            ("Cancel", "UI_BUTTON"),
            ("Delete", "UI_BUTTON"),
            ("Edit", "UI_BUTTON"),
            ("Add", "UI_BUTTON"),
            ("Search", "UI_BUTTON"),
            ("Export", "UI_BUTTON"),
            ("Import", "UI_BUTTON"),
            
            # Common labels
            ("Name", "UI_LABEL"),
            ("Description", "UI_LABEL"),
            ("Type", "UI_LABEL"),
            ("Unit", "UI_LABEL"),
            ("Cost", "UI_LABEL"),
            ("Quantity", "UI_LABEL"),
            ("Date", "UI_LABEL"),
            ("Status", "UI_LABEL"),
            
            # Messages
            ("Loading...", "UI_MESSAGE"),
            ("Success", "UI_MESSAGE"),
            ("Error", "UI_MESSAGE"),
            ("No data available", "UI_MESSAGE"),
            ("Are you sure?", "UI_MESSAGE")
        ]
        
        # Translate all common terms
        for text, context in common_terms:
            self.translate_text_sync(text, language, context)
    
    def __del__(self):
        """Clean up database connection"""
        if self.db_conn and not self.db_conn.closed:
            self.db_conn.close()

# Global instance
translation_service = TranslationService()

# Helper function for FastAPI endpoints
def get_translation(key: str, language: str, context: str = "UI") -> str:
    """Get a single translation"""
    if language == 'en':
        return key
    return translation_service.translate_text_sync(key, language, context)

# Helper function for bulk translations
async def get_translations_batch(keys: List[str], language: str, context: str = "UI") -> Dict[str, str]:
    """Get multiple translations"""
    if language == 'en':
        return {key: key for key in keys}
    
    translations = await translation_service.translate_batch(keys, language, context)
    return dict(zip(keys, translations))