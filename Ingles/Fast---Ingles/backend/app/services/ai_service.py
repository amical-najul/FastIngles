"""
Multi-provider AI Service for Fast-Ingles.
Supports: Google Gemini, Anthropic Claude, OpenAI ChatGPT, DeepSeek
"""

from typing import Literal, Optional
from dataclasses import dataclass
import json
import re


@dataclass
class WordEntry:
    """Represents a vocabulary word entry."""
    word: str
    pronunciation: str
    translation: str
    sentences: list[str]
    mnemonic: str
    
    def to_dict(self) -> dict:
        return {
            "word": self.word,
            "pronunciation": self.pronunciation,
            "translation": self.translation,
            "sentences": self.sentences,
            "mnemonic": self.mnemonic
        }


class AIService:
    """Multi-provider AI service for content generation."""
    
    PROMPT_TEMPLATE = """
Task: Generate exactly {count} English {category} related to topic: "{topic}".
Method: Ramón Campayo / Fast-Ingles (Word, Pronunciation, Translation, 5 Sentences, Mnemonic).

OUTPUT FORMAT:
Return ONLY a list using the pipe character (|) as separator. NO Markdown, NO JSON, NO Headers.
Format per line (9 columns):
Word|Pronunciation|Translation|Sentence1|Sentence2|Sentence3|Sentence4|Sentence5|Mnemonic

Example:
To Run|Ran|Correr|I run fast.|He runs home.|She runs a business.|We run together.|They run away.|Imagina una RANA ("Run") que CORRE muy rápido.

Ensure:
1. Exactly {count} lines.
2. Exactly 5 sentences per word.
3. Mnemonic must be in Spanish.
4. Sentences should be simple and use the target word clearly.
"""

    def __init__(
        self,
        provider: Literal["gemini", "claude", "chatgpt", "deepseek"],
        api_key: str,
        model: str
    ):
        self.provider = provider
        self.api_key = api_key
        self.model = model
        self._client = None
    
    async def generate_lesson(
        self,
        topic: str,
        category: str,
        count: int = 50
    ) -> list[dict]:
        """Generate vocabulary lesson using the configured AI provider."""
        import random
        # Inject random seed to avoid deterministic repetition
        seed = random.randint(1000, 9999)
        
        prompt = self.PROMPT_TEMPLATE.format(
            count=count,
            category=category,
            topic=f"{topic} (Variant {seed})"
        )
        
        try:
            if self.provider == "gemini":
                response = await self._generate_gemini(prompt)
            elif self.provider == "claude":
                response = await self._generate_claude(prompt)
            elif self.provider == "chatgpt":
                response = await self._generate_openai(prompt)
            elif self.provider == "deepseek":
                response = await self._generate_deepseek(prompt)
            else:
                raise ValueError(f"Unknown provider: {self.provider}")
            
            # Parse and convert to dictionaries for JSON serialization
            entries = self._parse_response(response)
            return [entry.to_dict() for entry in entries]
        except Exception as e:
            print(f"AI Generation Error ({self.provider}): {e}")
            raise
    
    async def _generate_gemini(self, prompt: str) -> str:
        """Generate content using Google Gemini."""
        import google.generativeai as genai
        
        genai.configure(api_key=self.api_key)
        
        # Configure model for varied, creative output
        generation_config = genai.GenerationConfig(
            temperature=1.0, # High temp = more randomness
            top_p=0.95,
            top_k=40,
        )
        
        model = genai.GenerativeModel(
            self.model,
            generation_config=generation_config
        )
        response = await model.generate_content_async(prompt)
        return response.text
    
    async def _generate_claude(self, prompt: str) -> str:
        """Generate content using Anthropic Claude."""
        import anthropic
        
        client = anthropic.AsyncAnthropic(api_key=self.api_key)
        response = await client.messages.create(
            model=self.model,
            max_tokens=8000,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text
    
    async def _generate_openai(self, prompt: str) -> str:
        """Generate content using OpenAI ChatGPT."""
        from openai import AsyncOpenAI
        
        client = AsyncOpenAI(api_key=self.api_key)
        response = await client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=8000
        )
        return response.choices[0].message.content
    
    async def _generate_deepseek(self, prompt: str) -> str:
        """Generate content using DeepSeek (OpenAI-compatible API)."""
        from openai import AsyncOpenAI
        
        client = AsyncOpenAI(
            api_key=self.api_key,
            base_url="https://api.deepseek.com/v1"
        )
        response = await client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=8000
        )
        return response.choices[0].message.content
    
    def _parse_response(self, text: str) -> list[WordEntry]:
        """Parse AI response into WordEntry list."""
        entries = []
        lines = text.strip().split('\n')
        
        for line in lines:
            # Clean line from numbering and bullets
            clean_line = re.sub(r'^[\d\-\.\*]+\s+', '', line).strip()
            if not clean_line:
                continue
            
            parts = clean_line.split('|')
            if len(parts) >= 9:
                entries.append(WordEntry(
                    word=parts[0].strip(),
                    pronunciation=parts[1].strip(),
                    translation=parts[2].strip(),
                    sentences=[
                        parts[3].strip(),
                        parts[4].strip(),
                        parts[5].strip(),
                        parts[6].strip(),
                        parts[7].strip()
                    ],
                    mnemonic=parts[8].strip()
                ))
        
        return entries


from app.config import get_settings

def get_ai_service(
    provider: Optional[str] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None
) -> AIService:
    """Factory function to create AI service using settings as defaults."""
    settings = get_settings()
    
    # Use provided values or fall back to defaults
    selected_provider = provider or settings.DEFAULT_AI_PROVIDER
    
    # Select API key based on provider
    if not api_key:
        if selected_provider == "gemini":
            api_key = settings.GEMINI_API_KEY
        elif selected_provider == "claude":
            api_key = settings.CLAUDE_API_KEY
        elif selected_provider == "chatgpt":
            api_key = settings.OPENAI_API_KEY
        elif selected_provider == "deepseek":
            api_key = settings.DEEPSEEK_API_KEY
            
    # Select Model based on provider
    if not model:
        if selected_provider == "gemini":
            model = settings.GEMINI_MODEL
        elif selected_provider == "claude":
            model = settings.CLAUDE_MODEL
        elif selected_provider == "chatgpt":
            model = settings.OPENAI_MODEL
        elif selected_provider == "deepseek":
            model = settings.DEEPSEEK_MODEL

    return AIService(
        provider=selected_provider,
        api_key=api_key or "",
        model=model or ""
    )
