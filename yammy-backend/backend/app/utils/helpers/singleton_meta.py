from typing import Any


class SingletonMeta(type):
    _instances: dict[type, Any] = {}

    def __call__(cls, *args: object, **kwargs: object) -> Any:
        if cls not in SingletonMeta._instances:
            SingletonMeta._instances[cls] = super().__call__(*args, **kwargs)
        return SingletonMeta._instances[cls]
