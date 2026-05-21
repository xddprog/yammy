from dishka import AsyncContainer, make_async_container
from dishka.integrations.taskiq import TaskiqProvider
from dishka.integrations.fastapi import FastapiProvider

from app.api.v1.dependency.providers.app import AppProvider
from app.api.v1.dependency.providers.request import RequestProvider
from app.api.v1.dependency.providers.websocket import WebSocketProvider


def setup_container() -> AsyncContainer:
    return make_async_container(
        AppProvider(),
        RequestProvider(),
        WebSocketProvider(),
        FastapiProvider(),
        TaskiqProvider(),
    )