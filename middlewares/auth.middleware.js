const { dbModels: { Token } } = require('../database');
const { tokenService } = require('../services');
const { config } = require('../constants');
const { dbModels: { User } } = require('../database');
const { authValidator } = require('../validators');
const { errorsHelper } = require('../helpers');

module.exports = {
    isLoginOrEmailExist: async (req, res, next) => {
        try {
            const { login, email } = req.body;

            const user = await User
                .findOne({
                    $or: [
                        { login },
                        { email }
                    ]
                })
                .select('+password');

            if (!user) {
                errorsHelper.throwWrongAuthError();
            }

            req.user = user;

            next();
        } catch (e) {
            next(e);
        }
    },
    chekBodyForLogIn: (req, res, next) => {
        try {
            const { error } = authValidator.logIn.validate(req.body);

            if (error) {
                errorsHelper.throwNotValidBody(error);
            }

            next();
        } catch (e) {
            next(e);
        }
    },

    checkToken: (type = 'access') => async (req, res, next) => {
        try {
            const { id } = req.params;

            const token = req.get(config.AUTHORIZATION);

            if (!token) {
                errorsHelper.throwUnauthorized();
            }

            await tokenService.verifyToken(token, type);

            const foundToken = await Token.findOne({ [type === 'access' ? 'accessToken' : 'refreshToken']: token });

            if (!foundToken) {
                errorsHelper.throwUnauthorized();
            }

            if (id && foundToken.user.id !== id) {
                errorsHelper.throwPermissionDenied();
            }

            req.user = foundToken.user;

            next();
        } catch (e) {
            next(e);
        }
    }
};