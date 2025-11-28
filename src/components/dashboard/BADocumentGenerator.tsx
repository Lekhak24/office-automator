import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader2, Download, Copy, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BADocumentGeneratorProps {
  userId: string;
}

type DocumentType = "user-story" | "brd" | "frd";

const documentTypeInfo = {
  "user-story": {
    label: "User Stories",
    description: "Agile user stories with acceptance criteria",
    icon: "📝",
  },
  "brd": {
    label: "Business Requirements Document",
    description: "Comprehensive BRD with all sections",
    icon: "📊",
  },
  "frd": {
    label: "Functional Requirements Document",
    description: "Detailed FRD with technical specifications",
    icon: "📋",
  },
};

const BADocumentGenerator = ({ userId }: BADocumentGeneratorProps) => {
  const [documentType, setDocumentType] = useState<DocumentType>("user-story");
  const [projectName, setProjectName] = useState("");
  const [context, setContext] = useState("");
  const [additionalRequirements, setAdditionalRequirements] = useState("");
  const [generatedDocument, setGeneratedDocument] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!context.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide project context or requirements.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedDocument("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke("generate-ba-document", {
        body: {
          type: documentType,
          context,
          projectName,
          additionalRequirements,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedDocument(data.document);
      toast({
        title: "Document Generated!",
        description: `Your ${documentTypeInfo[documentType].label} has been created successfully.`,
      });
    } catch (error: any) {
      console.error("Error generating document:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedDocument);
    toast({
      title: "Copied!",
      description: "Document copied to clipboard.",
    });
  };

  const handleDownload = () => {
    const blob = new Blob([generatedDocument], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName || "document"}-${documentType}-${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded!",
      description: "Document saved to your device.",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Document Generator
          </CardTitle>
          <CardDescription>
            Generate professional BA documents with AI assistance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="doc-type">Document Type</Label>
            <Select value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
              <SelectTrigger id="doc-type" className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(documentTypeInfo).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{info.icon}</span>
                      <div>
                        <div className="font-medium">{info.label}</div>
                        <div className="text-xs text-muted-foreground">{info.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name (Optional)</Label>
            <Input
              id="project-name"
              placeholder="e.g., Customer Portal Redesign"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">
              Project Context / Requirements <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="context"
              placeholder="Describe the project, business need, or feature requirements. Include as much detail as possible for better results..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="min-h-[150px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional">Additional Requirements (Optional)</Label>
            <Textarea
              id="additional"
              placeholder="Any specific requirements, constraints, or focus areas..."
              value={additionalRequirements}
              onChange={(e) => setAdditionalRequirements(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          <Button
            onClick={handleGenerate}
            className="w-full h-12 text-lg font-semibold"
            disabled={isGenerating || !context.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating with AI...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate {documentTypeInfo[documentType].label}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Output Preview */}
      <Card className="border-2 border-muted shadow-lg">
        <CardHeader className="bg-gradient-to-r from-muted to-muted/50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generated Document
              </CardTitle>
              <CardDescription>
                {generatedDocument ? "Your document is ready" : "Document will appear here"}
              </CardDescription>
            </div>
            {generatedDocument && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {isGenerating ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                  <p className="text-muted-foreground">AI is crafting your document...</p>
                  <p className="text-sm text-muted-foreground">This may take a moment</p>
                </div>
              </div>
            ) : generatedDocument ? (
              <div className="p-6 prose prose-sm max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {generatedDocument}
                </pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <div className="text-center space-y-2">
                  <FileText className="h-16 w-16 mx-auto opacity-20" />
                  <p>Fill in the form and click Generate</p>
                  <p className="text-sm">Your AI-generated document will appear here</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default BADocumentGenerator;
