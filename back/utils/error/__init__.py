class NotOwner(Exception):
    def __init__(self, resource):
        self.message = f"You are not the owner of this {resource}"
        self.error = "NotOwner"
        super().__init__(self.message)


class EmailFormatError(Exception):
    def __init__(self):
        self.message = "Email format is not valid"
        self.error = "EmailFormatError"
        super().__init__(self.message)


class EmailAlreadyExist(Exception):
    def __init__(self):
        self.message = "Email already exist"
        self.error = "EmailAlreadyExist"
        super().__init__(self.message)


class AccountNotFound(Exception):
    def __init__(self):
        self.message = "Account not found"
        self.error = "AccountNotFound"
        super().__init__(self.message)


class IncorrectPassword(Exception):
    def __init__(self):
        self.message = "Password is incorrect"
        self.error = "IncorrectPassword"
        super().__init__(self.message)