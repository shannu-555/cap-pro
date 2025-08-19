-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company TEXT,
  role TEXT DEFAULT 'analyst',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create research_queries table to store user searches
CREATE TABLE public.research_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  query_type TEXT NOT NULL CHECK (query_type IN ('product', 'company')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.research_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own queries" 
ON public.research_queries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create queries" 
ON public.research_queries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queries" 
ON public.research_queries 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create sentiment_analysis table for storing sentiment data
CREATE TABLE public.sentiment_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query_id UUID NOT NULL REFERENCES public.research_queries(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  content TEXT NOT NULL,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  confidence FLOAT NOT NULL DEFAULT 0,
  topics TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sentiment_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sentiment data for their queries" 
ON public.sentiment_analysis 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.research_queries 
    WHERE research_queries.id = sentiment_analysis.query_id 
    AND research_queries.user_id = auth.uid()
  )
);

-- Create competitor_data table for storing competitor insights
CREATE TABLE public.competitor_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query_id UUID NOT NULL REFERENCES public.research_queries(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  price DECIMAL,
  rating FLOAT,
  features JSONB,
  url TEXT,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.competitor_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view competitor data for their queries" 
ON public.competitor_data 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.research_queries 
    WHERE research_queries.id = competitor_data.query_id 
    AND research_queries.user_id = auth.uid()
  )
);

-- Create trend_data table for storing trend analysis
CREATE TABLE public.trend_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query_id UUID NOT NULL REFERENCES public.research_queries(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  trend_direction TEXT CHECK (trend_direction IN ('rising', 'falling', 'stable')),
  time_period TEXT NOT NULL,
  data_points JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trend_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view trend data for their queries" 
ON public.trend_data 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.research_queries 
    WHERE research_queries.id = trend_data.query_id 
    AND research_queries.user_id = auth.uid()
  )
);

-- Create research_reports table for storing generated reports
CREATE TABLE public.research_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query_id UUID NOT NULL REFERENCES public.research_queries(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  insights JSONB,
  recommendations JSONB,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.research_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reports for their queries" 
ON public.research_reports 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.research_queries 
    WHERE research_queries.id = research_reports.query_id 
    AND research_queries.user_id = auth.uid()
  )
);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

-- Create trigger for auto profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_research_queries_updated_at
  BEFORE UPDATE ON public.research_queries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();