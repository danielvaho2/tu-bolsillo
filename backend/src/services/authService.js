const authRepository = require('../db/authRepository');
// NOTA: En una aplicación real, necesitarías una librería de hashing como 'bcryptjs'.
// const bcrypt = require('bcryptjs'); 

/**
 * Registra un nuevo usuario, asegurando la unicidad del email y el hashing de la contraseña.
 */
exports.register = async (name, email, password) => {
    // 1. Regla de negocio: Verificar si el usuario ya existe
    const existingUser = await authRepository.findUserByEmail(email);

    if (existingUser) {
        const err = new Error('Ya existe un usuario con este correo electrónico.');
        err.status = 409; // Código HTTP 409 Conflict
        throw err;
    }

    // 2. Seguridad: Hashear la contraseña.
    // Usamos un placeholder por ahora, pero aquí iría la llamada a bcrypt:
    // const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPassword = `hashed_${password}`; 

    // 3. Crear el usuario en la DB
    const newUser = await authRepository.createUser(name, email, hashedPassword);
    
    // 4. Devolvemos el usuario sin la contraseña hasheada (desestructuración)
    const { password_hash, ...user } = newUser;
    return user; 
};

/**
 * Autentica a un usuario.
 */
exports.login = async (email, password) => {
    // 1. Buscar al usuario por email
    const user = await authRepository.findUserByEmail(email);

    if (!user) {
        const err = new Error('Credenciales inválidas.');
        err.status = 401; // Código HTTP 401 Unauthorized
        throw err;
    }

    // 2. Seguridad: Comparar la contraseña hasheada.
    // Aquí iría la llamada a bcrypt para comparar:
    // const isMatch = await bcrypt.compare(password, user.password_hash);
    
    // Placeholder de comparación:
    const isMatch = user.password_hash === `hashed_${password}`; 
    
    if (!isMatch) {
        const err = new Error('Credenciales inválidas.');
        err.status = 401; // Código HTTP 401 Unauthorized
        throw err;
    }

    // 3. Login exitoso. Devolvemos la información pública del usuario.
    const { password_hash, ...userInfo } = user;
    return userInfo;
};
