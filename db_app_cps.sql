-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 20-07-2025 a las 06:20:51
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `db_app_cps`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `armesp`
--

CREATE TABLE `armesp` (
  `id_armesp` int(11) NOT NULL,
  `abreviatura` varchar(50) NOT NULL,
  `armesp_completo` varchar(100) NOT NULL,
  `tipo` enum('Arma','Especialidad') NOT NULL DEFAULT 'Arma'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `equipos`
--

CREATE TABLE `equipos` (
  `id` int(11) NOT NULL,
  `nne` varchar(50) NOT NULL,
  `id_tipo_equipo` char(1) NOT NULL,
  `marca` varchar(100) DEFAULT NULL,
  `modelo` varchar(100) DEFAULT NULL,
  `ubicacion` varchar(255) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `ine` varchar(100) DEFAULT NULL,
  `en_servicio` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `especificaciones_equipo`
--

CREATE TABLE `especificaciones_equipo` (
  `id` int(11) NOT NULL,
  `id_equipo` int(11) NOT NULL,
  `clave` varchar(100) NOT NULL,
  `valor` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_equipo`
--

CREATE TABLE `estado_equipo` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estado_equipo`
--

INSERT INTO `estado_equipo` (`id`, `nombre`) VALUES
(5, 'BAJA'),
(1, 'E/S En Servicio'),
(6, 'EXT Extraviado'),
(2, 'F/S Fuera de Servicio'),
(3, 'MANT Mantenimiento'),
(4, 'REPAR Reparación');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `grado`
--

CREATE TABLE `grado` (
  `id_grado` int(11) NOT NULL,
  `abreviatura` varchar(50) DEFAULT NULL,
  `gradocompleto` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `persona`
--

CREATE TABLE `persona` (
  `id_persona` int(11) NOT NULL,
  `id_grado` int(11) DEFAULT NULL,
  `id_armesp` int(11) DEFAULT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `apellido` varchar(100) DEFAULT NULL,
  `nro_dni` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos_equipo`
--

CREATE TABLE `tipos_equipo` (
  `id` char(1) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipos_equipo`
--

INSERT INTO `tipos_equipo` (`id`, `nombre`) VALUES
('A', 'ARMAMENTO'),
('V', 'AUTOMOTORES'),
('P', 'AVIACIÓN'),
('E', 'ELECTRÓNICA Y ELECTRICIDAD'),
('H', 'EQUIPOS DE TALLER, MÁQUINAS Y HERRAMIENTAS'),
('I', 'INGENIEROS'),
('G', 'MAT GENERALES'),
('M', 'MUNICIÓN'),
('O', 'OP, INSTRUMENTAL Y EQU DE LABORATORIO'),
('Z', 'REP. DE ARS');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `unidades_equipo`
--

CREATE TABLE `unidades_equipo` (
  `id` int(11) NOT NULL,
  `id_equipo` int(11) NOT NULL,
  `nro_serie` varchar(100) NOT NULL,
  `id_estado` int(11) NOT NULL,
  `id_persona` int(11) DEFAULT NULL,
  `fecha_asignacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `armesp`
--
ALTER TABLE `armesp`
  ADD PRIMARY KEY (`id_armesp`);

--
-- Indices de la tabla `equipos`
--
ALTER TABLE `equipos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_equipos_tipos_equipo_idx` (`id_tipo_equipo`);

--
-- Indices de la tabla `especificaciones_equipo`
--
ALTER TABLE `especificaciones_equipo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_especificaciones_equipos_idx` (`id_equipo`);

--
-- Indices de la tabla `estado_equipo`
--
ALTER TABLE `estado_equipo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `grado`
--
ALTER TABLE `grado`
  ADD PRIMARY KEY (`id_grado`);

--
-- Indices de la tabla `persona`
--
ALTER TABLE `persona`
  ADD PRIMARY KEY (`id_persona`),
  ADD UNIQUE KEY `nro_dni` (`nro_dni`),
  ADD KEY `id_grado` (`id_grado`),
  ADD KEY `id_armesp` (`id_armesp`);

--
-- Indices de la tabla `tipos_equipo`
--
ALTER TABLE `tipos_equipo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `unidades_equipo`
--
ALTER TABLE `unidades_equipo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nro_serie` (`nro_serie`),
  ADD KEY `fk_unidades_equipos_idx` (`id_equipo`),
  ADD KEY `fk_unidades_estado_idx` (`id_estado`),
  ADD KEY `fk_unidades_persona_idx` (`id_persona`),
  ADD KEY `idx_unidades_serie` (`nro_serie`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `armesp`
--
ALTER TABLE `armesp`
  MODIFY `id_armesp` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `equipos`
--
ALTER TABLE `equipos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `especificaciones_equipo`
--
ALTER TABLE `especificaciones_equipo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT de la tabla `estado_equipo`
--
ALTER TABLE `estado_equipo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `grado`
--
ALTER TABLE `grado`
  MODIFY `id_grado` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `persona`
--
ALTER TABLE `persona`
  MODIFY `id_persona` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `unidades_equipo`
--
ALTER TABLE `unidades_equipo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `equipos`
--
ALTER TABLE `equipos`
  ADD CONSTRAINT `fk_equipos_tipos_equipo` FOREIGN KEY (`id_tipo_equipo`) REFERENCES `tipos_equipo` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `especificaciones_equipo`
--
ALTER TABLE `especificaciones_equipo`
  ADD CONSTRAINT `fk_especificaciones_equipos` FOREIGN KEY (`id_equipo`) REFERENCES `equipos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `persona`
--
ALTER TABLE `persona`
  ADD CONSTRAINT `persona_ibfk_1` FOREIGN KEY (`id_grado`) REFERENCES `grado` (`id_grado`),
  ADD CONSTRAINT `persona_ibfk_2` FOREIGN KEY (`id_armesp`) REFERENCES `armesp` (`id_armesp`);

--
-- Filtros para la tabla `unidades_equipo`
--
ALTER TABLE `unidades_equipo`
  ADD CONSTRAINT `fk_unidades_equipo_id` FOREIGN KEY (`id_equipo`) REFERENCES `equipos` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_unidades_estado_id` FOREIGN KEY (`id_estado`) REFERENCES `estado_equipo` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_unidades_persona_id` FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`) ON DELETE SET NULL ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
