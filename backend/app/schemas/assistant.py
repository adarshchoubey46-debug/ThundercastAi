from typing import Literal

from pydantic import BaseModel, Field


class AssistantTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class AssistantRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    language: Literal["en", "hi"] = "en"
    history: list[AssistantTurn] = Field(default_factory=list, max_length=10)


class AssistantResponse(BaseModel):
    answer: str
    provider: str
    context_sources: list[str]