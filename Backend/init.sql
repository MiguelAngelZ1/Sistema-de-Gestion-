-- Script de inicialización para la base de datos en producción
-- Este archivo será usado para crear las tablas necesarias en la base de datos de producción

-- Crear base de datos si no existe (opcional, dependiendo del proveedor)
CREATE DATABASE IF NOT EXISTS db_app_cps;
USE db_app_cps;

-- Las tablas y datos se crearán automáticamente mediante las migraciones en el código C#
-- Este archivo sirve como referencia para la estructura de la base de datos
