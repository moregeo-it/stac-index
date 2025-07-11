--
-- PostgreSQL database dump
--

-- Dumped from database version 12.8 (Ubuntu 12.8-0ubuntu0.20.04.1)
-- Dumped by pg_dump version 13.1

-- Started on 2021-10-19 00:40:50

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 202 (class 1259 OID 16413)
-- Name: catalogs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.catalogs (
    id integer NOT NULL,
    url text NOT NULL,
    slug character varying(50) NOT NULL,
    title character varying(50) NOT NULL,
    summary text NOT NULL,
    email character varying(255),
    access character varying(10) NOT NULL,
    access_info text,
    is_api boolean NOT NULL,
    created timestamp with time zone NOT NULL,
    updated timestamp with time zone NOT NULL
);


ALTER TABLE public.catalogs OWNER TO postgres;

--
-- TOC entry 203 (class 1259 OID 16419)
-- Name: catalogs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.catalogs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.catalogs_id_seq OWNER TO postgres;

--
-- TOC entry 2955 (class 0 OID 0)
-- Dependencies: 203
-- Name: catalogs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.catalogs_id_seq OWNED BY public.catalogs.id;


--
-- TOC entry 204 (class 1259 OID 16421)
-- Name: ecosystem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ecosystem (
    id integer NOT NULL,
    url text NOT NULL,
    title character varying(50) NOT NULL,
    summary text NOT NULL,
    categories character varying(50)[] NOT NULL,
    email character varying(255),
    created timestamp with time zone NOT NULL,
    updated timestamp with time zone NOT NULL,
    language character varying(50)
);


ALTER TABLE public.ecosystem OWNER TO postgres;

--
-- TOC entry 205 (class 1259 OID 16427)
-- Name: ecosystem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ecosystem_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ecosystem_id_seq OWNER TO postgres;

--
-- TOC entry 2956 (class 0 OID 0)
-- Dependencies: 205
-- Name: ecosystem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ecosystem_id_seq OWNED BY public.ecosystem.id;


--
-- TOC entry 207 (class 1259 OID 16476)
-- Name: tutorials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tutorials (
    id integer NOT NULL,
    url text NOT NULL,
    title character varying(200) NOT NULL,
    summary text NOT NULL,
    tags character varying(50)[] NOT NULL,
    email character varying(255),
    created timestamp with time zone NOT NULL,
    updated timestamp with time zone NOT NULL,
    language character(2) NOT NULL
);


ALTER TABLE public.tutorials OWNER TO postgres;

--
-- TOC entry 206 (class 1259 OID 16474)
-- Name: tutorials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tutorials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tutorials_id_seq OWNER TO postgres;

--
-- TOC entry 2957 (class 0 OID 0)
-- Dependencies: 206
-- Name: tutorials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tutorials_id_seq OWNED BY public.tutorials.id;


--
-- TOC entry 2811 (class 2604 OID 16429)
-- Name: catalogs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalogs ALTER COLUMN id SET DEFAULT nextval('public.catalogs_id_seq'::regclass);


--
-- TOC entry 2812 (class 2604 OID 16430)
-- Name: ecosystem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ecosystem ALTER COLUMN id SET DEFAULT nextval('public.ecosystem_id_seq'::regclass);


--
-- TOC entry 2813 (class 2604 OID 16479)
-- Name: tutorials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutorials ALTER COLUMN id SET DEFAULT nextval('public.tutorials_id_seq'::regclass);


--
-- TOC entry 2815 (class 2606 OID 16432)
-- Name: catalogs catalogs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalogs
    ADD CONSTRAINT catalogs_pkey PRIMARY KEY (id);


--
-- TOC entry 2817 (class 2606 OID 16434)
-- Name: catalogs catalogs_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalogs
    ADD CONSTRAINT catalogs_slug_key UNIQUE (slug);


--
-- TOC entry 2819 (class 2606 OID 16436)
-- Name: catalogs catalogs_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalogs
    ADD CONSTRAINT catalogs_url_key UNIQUE (url);


--
-- TOC entry 2821 (class 2606 OID 16438)
-- Name: ecosystem ecosystem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ecosystem
    ADD CONSTRAINT ecosystem_pkey PRIMARY KEY (id);


--
-- TOC entry 2823 (class 2606 OID 16440)
-- Name: ecosystem ecosystem_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ecosystem
    ADD CONSTRAINT ecosystem_url_key UNIQUE (url);


-- Completed on 2021-10-19 00:40:52

--
-- PostgreSQL database dump complete
--

